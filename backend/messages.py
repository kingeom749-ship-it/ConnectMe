import uuid
from datetime import datetime, timezone
from typing import Callable, List, Optional

from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel, Field

from blocks import assert_not_blocked, block_state, hidden_ids

PUBLIC_FIELDS = {"_id": 0, "token_hash": 0}

def _now() -> datetime:
    return datetime.now(timezone.utc)


def pair_key(a: str, b: str) -> str:
    return ":".join(sorted((a, b)))


class MessageCreate(BaseModel):
    text: str = Field(min_length=1, max_length=1000)


class MessageOut(BaseModel):
    id: str
    text: str
    sender_id: str
    mine: bool
    created_at: str
    read_at: Optional[str] = None


class ThreadOut(BaseModel):
    person: dict
    messages: List[MessageOut]
    blocked_by_me: bool = False
    blocked_me: bool = False


class ConversationOut(BaseModel):
    person: dict
    last_message: MessageOut
    unread: int


def _out(doc: dict, viewer_id: str) -> MessageOut:
    return MessageOut(id=doc["id"], text=doc["text"], sender_id=doc["sender_id"], mine=doc["sender_id"] == viewer_id,
                      created_at=doc["created_at"], read_at=doc.get("read_at"))


def build_messages_router(db, current_person: Callable, person_model) -> APIRouter:
    router = APIRouter(prefix="/api/conversations")

    async def other_person(other_id: str, me_id: str) -> dict:
        if other_id == me_id:
            raise HTTPException(400, "You can't message yourself")
        other = await db.people.find_one({"id": other_id}, PUBLIC_FIELDS)
        if not other:
            raise HTTPException(404, "Person not found")
        return other

    def public(doc: dict) -> dict:
        return person_model.from_mongo(doc).model_dump()

    @router.get("", response_model=List[ConversationOut])
    async def list_conversations(x_person_token: Optional[str] = Header(default=None)):
        me = await current_person(x_person_token)
        pipeline = [
            {"$match": {"participants": me["id"]}},
            {"$sort": {"created_at": -1}},
            {"$group": {
                "_id": "$pair",
                "last": {"$first": "$$ROOT"},
                "unread": {"$sum": {"$cond": [{"$and": [{"$eq": ["$recipient_id", me["id"]]}, {"$eq": ["$read_at", None]}]}, 1, 0]}},
            }},
            {"$sort": {"last.created_at": -1}},
        ]
        rows = await db.messages.aggregate(pipeline).to_list(200)
        hidden = await hidden_ids(db, me["id"])
        out = []
        for row in rows:
            last = row["last"]
            other_id = last["recipient_id"] if last["sender_id"] == me["id"] else last["sender_id"]
            if other_id in hidden:
                continue
            other = await db.people.find_one({"id": other_id}, PUBLIC_FIELDS)
            if other:
                out.append(ConversationOut(person=public(other), last_message=_out(last, me["id"]), unread=row["unread"]))
        return out

    @router.get("/unread")
    async def unread_count(x_person_token: Optional[str] = Header(default=None)):
        me = await current_person(x_person_token)
        hidden = await hidden_ids(db, me["id"])
        n = await db.messages.count_documents({"recipient_id": me["id"], "read_at": None, "sender_id": {"$nin": list(hidden)}})
        return {"count": n}

    @router.get("/{other_id}", response_model=ThreadOut)
    async def get_thread(other_id: str, x_person_token: Optional[str] = Header(default=None)):
        me = await current_person(x_person_token)
        other = await other_person(other_id, me["id"])
        key = pair_key(me["id"], other_id)
        await db.messages.update_many({"pair": key, "recipient_id": me["id"], "read_at": None},
                                      {"$set": {"read_at": _now().isoformat()}})
        docs = await db.messages.find({"pair": key}, {"_id": 0}).sort("created_at", 1).to_list(500)
        state = await block_state(db, me["id"], other_id)
        return ThreadOut(person=public(other), messages=[_out(d, me["id"]) for d in docs], **state.model_dump())

    @router.post("/{other_id}", response_model=List[MessageOut])
    async def send_message(other_id: str, body: MessageCreate, x_person_token: Optional[str] = Header(default=None)):
        me = await current_person(x_person_token)
        await other_person(other_id, me["id"])
        await assert_not_blocked(db, me["id"], other_id)
        key = pair_key(me["id"], other_id)
        text = " ".join(body.text.split())
        if not text:
            raise HTTPException(400, "Message can't be empty")
        docs = [{
            "id": str(uuid.uuid4()), "pair": key, "participants": [me["id"], other_id], "sender_id": me["id"],
            "recipient_id": other_id, "text": text, "created_at": _now().isoformat(), "read_at": None,
        }]
        await db.messages.insert_many(docs)
        return [_out(d, me["id"]) for d in docs]

    return router
