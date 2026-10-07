from fastapi import FastAPI, APIRouter, HTTPException, Header, Query
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import re
import logging
import hashlib
import secrets
from pathlib import Path
from pydantic import BaseModel, Field, field_validator
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
from otp import build_otp_router, consume_verification, normalize_phone, twilio_config
from messages import build_messages_router
from blocks import build_blocks_router, assert_not_blocked, hidden_ids
from auth import build_auth_router, link_session, pending_session, session_person

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

client = AsyncIOMotorClient(os.environ['MONGO_URL'])
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

INTERESTS = ["dancing", "gaming", "sports", "writing", "singing",
             "ai-building", "content-creation", "run-club", "pickleball", "anime", "photography", "music-production"]
DEPARTMENTS = ["B.Tech", "BE", "MBA", "CDAC", "Pharmacy"]
SHARE_MINUTES = 60
PUBLIC_FIELDS = {"_id": 0, "token_hash": 0}


def now() -> datetime:
    return datetime.now(timezone.utc)


def mask_phone(phone: str) -> str:
    digits = re.sub(r"\D", "", phone)
    prefix = f"+{digits[:-10]} " if phone.startswith("+") and len(digits) > 10 else ""
    return f"{prefix}••••• ••{digits[-3:]}"


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


class PersonCreate(BaseModel):
    name: str = Field(min_length=2, max_length=60)
    phone: str = Field(min_length=7, max_length=20)
    interests: List[str] = Field(min_length=1)
    department: str
    accepts_location_requests: bool = False
    verification_token: str = Field(min_length=10)
    google_session_token: Optional[str] = None

    @field_validator("name")
    @classmethod
    def clean_name(cls, v: str) -> str:
        v = " ".join(v.split())
        if len(v) < 2:
            raise ValueError("Name is too short")
        return v

    @field_validator("phone")
    @classmethod
    def clean_phone(cls, v: str) -> str:
        p = normalize_phone(v)
        if not 10 <= len(p.lstrip("+")) <= 15:
            raise ValueError("Phone number must have 10 to 15 digits")
        return p

    @field_validator("interests")
    @classmethod
    def check_interests(cls, v: List[str]) -> List[str]:
        v = list(dict.fromkeys(i.lower() for i in v))
        if any(i not in INTERESTS for i in v):
            raise ValueError("Unknown interest")
        return v

    @field_validator("department")
    @classmethod
    def check_department(cls, v: str) -> str:
        if v not in DEPARTMENTS:
            raise ValueError("Unknown department")
        return v


class Person(BaseModel):
    id: str
    name: str
    phone_masked: str
    picture: str = ""
    interests: List[str]
    department: str
    accepts_location_requests: bool
    is_demo: bool = False
    created_at: str

    @classmethod
    def from_mongo(cls, doc: dict) -> "Person":
        return cls(phone_masked=mask_phone(doc["phone"]), **{k: v for k, v in doc.items() if k in cls.model_fields})


class Me(Person):
    phone: str

    @classmethod
    def from_mongo(cls, doc: dict) -> "Me":
        return cls(phone_masked=mask_phone(doc["phone"]), **{k: v for k, v in doc.items() if k in cls.model_fields})


class RegisterResponse(BaseModel):
    person: Me
    token: str


class SharedLocation(BaseModel):
    lat: float
    lng: float
    accuracy_m: Optional[float] = None
    shared_at: str
    expires_at: str


class Meetup(BaseModel):
    lat: float
    lng: float
    label: str
    status: str
    proposed_by_me: bool
    proposed_at: str
    accepted_at: Optional[str] = None
    meet_at: Optional[str] = None


MEETUP_WINDOW = timedelta(minutes=15)


class LocationRequestOut(BaseModel):
    id: str
    status: str
    note: str
    created_at: str
    responded_at: Optional[str] = None
    counterpart: Optional[Person] = None
    location: Optional[SharedLocation] = None
    meetup: Optional[Meetup] = None
    contact_phone: Optional[str] = None
    is_demo: bool = False


class MeetupCreate(BaseModel):
    lat: float = Field(ge=-90, le=90)
    lng: float = Field(ge=-180, le=180)
    label: str = Field(min_length=2, max_length=60)


class MeetupRespond(BaseModel):
    accept: bool


class RequestCreate(BaseModel):
    target_id: str
    note: str = Field(default="", max_length=140)


class RespondBody(BaseModel):
    accept: bool
    lat: Optional[float] = Field(default=None, ge=-90, le=90)
    lng: Optional[float] = Field(default=None, ge=-180, le=180)
    accuracy: Optional[float] = Field(default=None, ge=0)


async def current_person(token: Optional[str]) -> dict:
    if not token:
        raise HTTPException(401, "Register or pick a profile first")
    doc = await db.people.find_one({"token_hash": hash_token(token)}, {"_id": 0}) or await session_person(db, token)
    if not doc:
        raise HTTPException(401, "Profile not found")
    return doc


def effective_status(doc: dict) -> str:
    if doc["status"] == "shared" and doc.get("expires_at") and doc["expires_at"] < now().isoformat():
        return "expired"
    return doc["status"]


async def serialize_request(doc: dict, viewer_id: str) -> LocationRequestOut:
    other_id = doc["target_id"] if doc["requester_id"] == viewer_id else doc["requester_id"]
    other = await db.people.find_one({"id": other_id}, PUBLIC_FIELDS)
    status = effective_status(doc)
    location = meetup = contact_phone = None
    if status == "shared" and doc.get("location"):
        location = SharedLocation(**doc["location"], shared_at=doc["responded_at"], expires_at=doc["expires_at"])
        m = doc.get("meetup")
        if m:
            meetup = Meetup(lat=m["lat"], lng=m["lng"], label=m["label"], status=m["status"],
                            proposed_by_me=m["proposed_by"] == viewer_id, proposed_at=m["proposed_at"],
                            accepted_at=m.get("accepted_at"), meet_at=m.get("meet_at"))
            if m["status"] == "accepted" and other:
                contact_phone = other.get("phone")
    return LocationRequestOut(
        id=doc["id"], status=status, note=doc.get("note", ""), created_at=doc["created_at"],
        responded_at=doc.get("responded_at"), counterpart=Person.from_mongo(other) if other else None,
        location=location, meetup=meetup, contact_phone=contact_phone, is_demo=doc.get("is_demo", False),
    )


@api_router.get("/")
async def root():
    return {"message": "ConnectMe API"}


@api_router.get("/meta")
async def meta():
    people = await db.people.find({}, {"_id": 0, "interests": 1, "department": 1}).to_list(5000)
    return {
        "total": len(people),
        "interests": {i: sum(i in p.get("interests", []) for p in people) for i in INTERESTS},
        "departments": {d: sum(p.get("department") == d for p in people) for d in DEPARTMENTS},
        "otp_mode": "sms" if twilio_config() else "demo",
    }


@api_router.post("/people", response_model=RegisterResponse)
async def register(body: PersonCreate):
    if await db.people.find_one({"phone": body.phone}, {"_id": 1}):
        raise HTTPException(409, "This phone number is already registered")
    google = await pending_session(db, body.google_session_token)
    await consume_verification(db, body.phone, body.verification_token)
    token = secrets.token_urlsafe(32)
    doc = {**body.model_dump(exclude={"verification_token", "google_session_token"}), "phone_verified": True, "id": str(uuid.uuid4()),
           "is_demo": False, "created_at": now().isoformat(), "token_hash": hash_token(token)}
    if google:
        doc.update(google_email=google["email"], picture=google.get("picture", ""))
    await db.people.insert_one(doc)
    if google:
        await link_session(db, body.google_session_token, doc["id"])
    if body.accepts_location_requests:
        demo = await db.people.find_one({"is_demo": True}, {"_id": 0}, sort=[("created_at", 1)])
        if demo:
            await db.location_requests.insert_one({
                "id": str(uuid.uuid4()), "requester_id": demo["id"], "target_id": doc["id"],
                "note": "Demo request — try approving or declining to see how consent works.",
                "status": "pending", "created_at": now().isoformat(), "is_demo": True,
            })
    return RegisterResponse(person=Me.from_mongo(doc), token=token)


@api_router.get("/people", response_model=List[Person])
async def list_people(q: str = "", interest: str = "", department: str = "", x_person_token: Optional[str] = Header(default=None)):
    query: dict = {}
    if x_person_token:
        viewer = await db.people.find_one({"token_hash": hash_token(x_person_token)}, {"_id": 0, "id": 1}) or await session_person(db, x_person_token)
        if viewer:
            hidden = await hidden_ids(db, viewer["id"])
            if hidden:
                query["id"] = {"$nin": list(hidden)}
    if interest:
        query["interests"] = interest.lower()
    if department:
        query["department"] = department
    q = q.strip()
    digits = re.sub(r"\D", "", q)
    if q and len(digits) >= 10 and len(digits) >= len(q.replace(" ", "")) - 1:
        query["phone"] = {"$regex": f"{re.escape(digits)}$"}
    elif q:
        query["name"] = {"$regex": re.escape(q), "$options": "i"}
    docs = await db.people.find(query, PUBLIC_FIELDS).sort([("is_demo", 1), ("created_at", -1)]).to_list(500)
    return [Person.from_mongo(d) for d in docs]


@api_router.get("/me", response_model=Me)
async def me(x_person_token: Optional[str] = Header(default=None)):
    return Me.from_mongo(await current_person(x_person_token))


@api_router.get("/location-requests")
async def my_requests(x_person_token: Optional[str] = Header(default=None)):
    person = await current_person(x_person_token)
    pid = person["id"]
    incoming = await db.location_requests.find({"target_id": pid}, {"_id": 0}).sort("created_at", -1).to_list(200)
    outgoing = await db.location_requests.find({"requester_id": pid}, {"_id": 0}).sort("created_at", -1).to_list(200)
    return {
        "incoming": [await serialize_request(d, pid) for d in incoming],
        "outgoing": [await serialize_request(d, pid) for d in outgoing],
    }


@api_router.post("/location-requests", response_model=LocationRequestOut)
async def create_request(body: RequestCreate, x_person_token: Optional[str] = Header(default=None)):
    person = await current_person(x_person_token)
    if body.target_id == person["id"]:
        raise HTTPException(400, "You can't request your own location")
    target = await db.people.find_one({"id": body.target_id}, {"_id": 0})
    if not target:
        raise HTTPException(404, "Person not found")
    if not target.get("accepts_location_requests"):
        raise HTTPException(403, f"{target['name']} isn't accepting location requests")
    await assert_not_blocked(db, person["id"], target["id"])
    existing = await db.location_requests.find_one(
        {"requester_id": person["id"], "target_id": target["id"], "status": {"$in": ["pending", "shared"]}}, {"_id": 0})
    if existing and effective_status(existing) in ("pending", "shared"):
        return await serialize_request(existing, person["id"])
    doc = {"id": str(uuid.uuid4()), "requester_id": person["id"], "target_id": target["id"],
           "note": body.note.strip(), "status": "pending", "created_at": now().isoformat(), "is_demo": False}
    await db.location_requests.insert_one(doc)
    return await serialize_request(doc, person["id"])


async def owned_request(request_id: str, person_id: str, role: str) -> dict:
    doc = await db.location_requests.find_one({"id": request_id}, {"_id": 0})
    if not doc or doc[role] != person_id:
        raise HTTPException(404, "Request not found")
    return doc


@api_router.post("/location-requests/{request_id}/respond", response_model=LocationRequestOut)
async def respond(request_id: str, body: RespondBody, x_person_token: Optional[str] = Header(default=None)):
    person = await current_person(x_person_token)
    doc = await owned_request(request_id, person["id"], "target_id")
    if doc["status"] != "pending":
        raise HTTPException(400, "This request was already answered")
    update: dict = {"responded_at": now().isoformat()}
    if body.accept:
        if body.lat is None or body.lng is None:
            raise HTTPException(400, "Location is required to approve")
        update.update(status="shared", expires_at=(now() + timedelta(minutes=SHARE_MINUTES)).isoformat(),
                      location={"lat": round(body.lat, 2), "lng": round(body.lng, 2),
                                "accuracy_m": max(round(body.accuracy or 0), 1000)})
    else:
        update["status"] = "declined"
    await db.location_requests.update_one({"id": request_id}, {"$set": update})
    return await serialize_request({**doc, **update}, person["id"])


@api_router.post("/location-requests/{request_id}/revoke", response_model=LocationRequestOut)
async def revoke(request_id: str, x_person_token: Optional[str] = Header(default=None)):
    person = await current_person(x_person_token)
    doc = await owned_request(request_id, person["id"], "target_id")
    update = {"status": "revoked", "responded_at": now().isoformat()}
    await db.location_requests.update_one({"id": request_id}, {"$set": update, "$unset": {"location": "", "expires_at": "", "meetup": ""}})
    doc.pop("location", None)
    return await serialize_request({**doc, **update}, person["id"])


@api_router.post("/location-requests/{request_id}/cancel", response_model=LocationRequestOut)
async def cancel(request_id: str, x_person_token: Optional[str] = Header(default=None)):
    person = await current_person(x_person_token)
    doc = await owned_request(request_id, person["id"], "requester_id")
    update = {"status": "cancelled"}
    await db.location_requests.update_one({"id": request_id}, {"$set": update, "$unset": {"location": "", "expires_at": "", "meetup": ""}})
    doc.pop("location", None)
    return await serialize_request({**doc, **update}, person["id"])


async def shared_request_for(request_id: str, person_id: str) -> dict:
    doc = await db.location_requests.find_one({"id": request_id}, {"_id": 0})
    if not doc or person_id not in (doc["requester_id"], doc["target_id"]):
        raise HTTPException(404, "Request not found")
    if effective_status(doc) != "shared":
        raise HTTPException(400, "Meet-up spots can only be set while a location is being shared")
    return doc


@api_router.post("/location-requests/{request_id}/meetup", response_model=LocationRequestOut)
async def propose_meetup(request_id: str, body: MeetupCreate, x_person_token: Optional[str] = Header(default=None)):
    person = await current_person(x_person_token)
    doc = await shared_request_for(request_id, person["id"])
    meetup = {"lat": round(body.lat, 5), "lng": round(body.lng, 5), "label": " ".join(body.label.split()),
              "status": "proposed", "proposed_by": person["id"], "proposed_at": now().isoformat()}
    await db.location_requests.update_one({"id": request_id}, {"$set": {"meetup": meetup}})
    return await serialize_request({**doc, "meetup": meetup}, person["id"])


@api_router.post("/location-requests/{request_id}/meetup/respond", response_model=LocationRequestOut)
async def respond_meetup(request_id: str, body: MeetupRespond, x_person_token: Optional[str] = Header(default=None)):
    person = await current_person(x_person_token)
    doc = await shared_request_for(request_id, person["id"])
    meetup = doc.get("meetup")
    if not meetup or meetup["status"] != "proposed":
        raise HTTPException(400, "There's no meet-up spot waiting for an answer")
    if meetup["proposed_by"] == person["id"]:
        raise HTTPException(403, "The other person needs to answer your suggestion")
    meetup = {**meetup, "status": "accepted" if body.accept else "declined"}
    if body.accept:
        t = now()
        meetup.update(accepted_at=t.isoformat(), meet_at=(t + MEETUP_WINDOW).isoformat())
    await db.location_requests.update_one({"id": request_id}, {"$set": {"meetup": meetup}})
    return await serialize_request({**doc, "meetup": meetup}, person["id"])


DEMO_PEOPLE = [
    ("Aarav Mehta", ["gaming", "sports"], "B.Tech"),
    ("Diya Sharma", ["dancing", "singing"], "MBA"),
    ("Kabir Nair", ["writing"], "BE"),
    ("Ananya Iyer", ["singing", "writing"], "Pharmacy"),
    ("Rohan Gupta", ["sports"], "CDAC"),
    ("Meera Pillai", ["dancing"], "B.Tech"),
    ("Vihaan Reddy", ["gaming"], "CDAC"),
    ("Isha Kapoor", ["writing", "dancing"], "MBA"),
    ("Arjun Das", ["sports", "gaming"], "BE"),
    ("Sana Qureshi", ["singing"], "B.Tech"),
    ("Nikhil Joshi", ["gaming", "writing"], "Pharmacy"),
    ("Tara Menon", ["dancing", "sports"], "BE"),
    ("Aditya Rao", ["ai-building", "gaming"], "CDAC"),
    ("Priya Desai", ["content-creation", "dancing"], "MBA"),
    ("Yash Malhotra", ["run-club", "sports"], "B.Tech"),
    ("Sneha Kulkarni", ["pickleball", "run-club"], "Pharmacy"),
    ("Dev Bhatt", ["anime", "gaming", "ai-building"], "BE"),
    ("Riya Chatterjee", ["photography", "content-creation"], "MBA"),
    ("Karan Singh", ["music-production", "singing"], "B.Tech"),
    ("Ishaan Verma", ["ai-building", "photography"], "CDAC"),
]


@app.on_event("startup")
async def seed():
    await db.people.create_index("phone", unique=True)
    await db.people.create_index("id", unique=True)
    await db.location_requests.create_index("id", unique=True)
    await db.otp_codes.create_index("phone", unique=True)
    await db.messages.create_index([("pair", 1), ("created_at", 1)])
    await db.messages.create_index([("recipient_id", 1), ("read_at", 1)])
    await db.blocks.create_index([("blocker_id", 1), ("blocked_id", 1)], unique=True)
    await db.user_sessions.create_index("session_token", unique=True)
    await db.people.create_index("google_email", unique=True, sparse=True)
    base = now() - timedelta(days=30)
    for i, (name, interests, dept) in enumerate(DEMO_PEOPLE):
        phone = f"+9100000000{i:02d}"
        if await db.people.find_one({"phone": phone}, {"_id": 1}):
            continue
        await db.people.insert_one({
            "id": str(uuid.uuid4()), "name": name, "phone": phone, "interests": interests,
            "department": dept, "accepts_location_requests": i % 4 != 3, "is_demo": True,
            "created_at": (base + timedelta(hours=i)).isoformat(), "token_hash": hash_token(secrets.token_urlsafe(32)),
        })


app.include_router(api_router)
app.include_router(build_otp_router(db))
app.include_router(build_messages_router(db, current_person, Person))
app.include_router(build_blocks_router(db, current_person, Person))
app.include_router(build_auth_router(db, Me))

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
