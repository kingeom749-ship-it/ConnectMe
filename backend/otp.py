import asyncio
import hashlib
import logging
import os
import re
import secrets
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

logger = logging.getLogger("otp")

CODE_TTL = timedelta(minutes=10)
VERIFIED_TTL = timedelta(minutes=20)
RESEND_GAP = timedelta(seconds=30)
MAX_ATTEMPTS = 5


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _hash(v: str) -> str:
    return hashlib.sha256(v.encode()).hexdigest()


def normalize_phone(raw: str) -> str:
    digits = re.sub(r"\D", "", raw)
    if raw.strip().startswith("+"):
        return "+" + digits
    if len(digits) == 10:
        return "+91" + digits
    return "+" + digits


def twilio_config():
    sid, token, service = (os.environ.get(k) for k in ("TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_VERIFY_SERVICE"))
    return (sid, token, service) if sid and token and service else None


def _twilio_send(phone: str) -> None:
    from twilio.rest import Client
    sid, token, service = twilio_config()
    Client(sid, token).verify.v2.services(service).verifications.create(to=phone, channel="sms")


def _twilio_check(phone: str, code: str) -> bool:
    from twilio.rest import Client
    sid, token, service = twilio_config()
    check = Client(sid, token).verify.v2.services(service).verification_checks.create(to=phone, code=code)
    return check.status == "approved"


class SendBody(BaseModel):
    phone: str = Field(min_length=7, max_length=20)


class VerifyBody(BaseModel):
    phone: str = Field(min_length=7, max_length=20)
    code: str = Field(min_length=4, max_length=10)


def valid_phone(raw: str) -> str:
    p = normalize_phone(raw)
    if not 10 <= len(p) - 1 <= 15:
        raise HTTPException(400, "Phone number must have 10 to 15 digits")
    return p


def build_otp_router(db) -> APIRouter:
    router = APIRouter(prefix="/api/otp")

    @router.post("/send")
    async def send(body: SendBody):
        phone = valid_phone(body.phone)
        if await db.people.find_one({"phone": phone}, {"_id": 1}):
            raise HTTPException(409, "This phone number is already registered")
        prev = await db.otp_codes.find_one({"phone": phone}, {"_id": 0})
        if prev and prev.get("last_sent_at", "") > (_now() - RESEND_GAP).isoformat():
            raise HTTPException(429, "Please wait 30 seconds before requesting another code")
        record = {"phone": phone, "last_sent_at": _now().isoformat(), "attempts": 0,
                  "expires_at": (_now() + CODE_TTL).isoformat()}
        result = {"phone": phone, "mode": "sms"}
        if twilio_config():
            try:
                await asyncio.to_thread(_twilio_send, phone)
            except Exception as e:
                logger.warning("Twilio send failed: %s", e)
                raise HTTPException(502, "We couldn't send an SMS to this number. Check it and try again.")
            record["code_hash"] = None
        else:
            code = f"{secrets.randbelow(1_000_000):06d}"
            record["code_hash"] = _hash(phone + code)
            result.update(mode="demo", demo_code=code)
        await db.otp_codes.update_one({"phone": phone}, {"$set": record, "$unset": {"verified_hash": "", "verified_until": ""}}, upsert=True)
        return result

    @router.post("/verify")
    async def verify(body: VerifyBody):
        phone = valid_phone(body.phone)
        rec = await db.otp_codes.find_one({"phone": phone}, {"_id": 0})
        if not rec or rec["expires_at"] < _now().isoformat():
            raise HTTPException(400, "Code expired. Request a new one.")
        if rec.get("attempts", 0) >= MAX_ATTEMPTS:
            raise HTTPException(429, "Too many attempts. Request a new code.")
        await db.otp_codes.update_one({"phone": phone}, {"$inc": {"attempts": 1}})
        code = body.code.strip()
        if rec.get("code_hash"):
            ok = secrets.compare_digest(rec["code_hash"], _hash(phone + code))
        else:
            try:
                ok = await asyncio.to_thread(_twilio_check, phone, code)
            except Exception as e:
                logger.warning("Twilio check failed: %s", e)
                ok = False
        if not ok:
            raise HTTPException(400, "That code isn't right. Try again.")
        token = secrets.token_urlsafe(24)
        await db.otp_codes.update_one({"phone": phone}, {"$set": {
            "verified_hash": _hash(token), "verified_until": (_now() + VERIFIED_TTL).isoformat(), "expires_at": _now().isoformat()}})
        return {"phone": phone, "verification_token": token}

    return router


async def consume_verification(db, phone: str, token: str) -> None:
    rec = await db.otp_codes.find_one({"phone": phone}, {"_id": 0})
    if (not rec or not rec.get("verified_hash") or rec.get("verified_until", "") < _now().isoformat()
            or not secrets.compare_digest(rec["verified_hash"], _hash(token))):
        raise HTTPException(403, "Please verify your phone number first")
    await db.otp_codes.delete_one({"phone": phone})
