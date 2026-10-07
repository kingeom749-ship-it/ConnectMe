import uuid
from datetime import datetime, timezone
from typing import Callable, List, Optional

from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel, Field

PUBLIC_FIELDS = {"_id": 0, "token_hash": 0}


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


class BlockBody(BaseModel):
    reason: str = Field(default="", max_length=280)
    report: bool = False


class BlockOut(BaseModel):
    person: dict
    reason: str
    created_at: str


class BlockState(BaseModel):
    blocked_by_me: bool
    blocked_me: bool


async def block_state(db, me_id: str, other_id: str) -> BlockState:
    docs = await db.blocks.find({"$or": [{"blocker_id": me_id, "blocked_id": other_id}, {"blocker_id": other_id, "blocked_id": me_id}]},
                                {"_id": 0, "blocker_id": 1}).to_list(2)
    ids = {d["blocker_id"] for d in docs}
    return BlockState(blocked_by_me=me_id in ids, blocked_me=other_id in ids)


async def assert_not_blocked(db, me_id: str, other_id: str) -> None:
    state = await block_state(db, me_id, other_id)
    if state.blocked_by_me:
        raise HTTPException(403, "You blocked this person. Unblock them first.")
    if state.blocked_me:
        raise HTTPException(403, "This person isn't accepting contact from you.")


async def hidden_ids(db, me_id: str) -> set:
    docs = await db.blocks.find({"$or": [{"blocker_id": me_id}, {"blocked_id": me_id}]}, {"_id": 0}).to_list(1000)
    return {d["blocked_id"] if d["blocker_id"] == me_id else d["blocker_id"] for d in docs}


async def sever_requests(db, me_id: str, other_id: str) -> None:
    pair = {"$or": [{"requester_id": me_id, "target_id": other_id}, {"requester_id": other_id, "target_id": me_id}]}
    now = _now()
    await db.location_requests.update_many({**pair, "status": "shared"}, {
        "$set": {"status": "revoked", "responded_at": now}, "$unset": {"location": "", "expires_at": "", "meetup": ""}})
    await db.location_requests.update_many({**pair, "status": "pending", "requester_id": other_id}, {"$set": {"status": "declined", "responded_at": now}})
    await db.location_requests.update_many({**pair, "status": "pending", "requester_id": me_id}, {"$set": {"status": "cancelled", "responded_at": now}})


def build_blocks_router(db, current_person: Callable, person_model) -> APIRouter:
    router = APIRouter(prefix="/api/blocks")

    def public(doc: dict) -> dict:
        return person_model.from_mongo(doc).model_dump()

    @router.get("", response_model=List[BlockOut])
    async def list_blocks(x_person_token: Optional[str] = Header(default=None)):
        me = await current_person(x_person_token)
        docs = await db.blocks.find({"blocker_id": me["id"]}, {"_id": 0}).sort("created_at", -1).to_list(500)
        out = []
        for b in docs:
            p = await db.people.find_one({"id": b["blocked_id"]}, PUBLIC_FIELDS)
            if p:
                out.append(BlockOut(person=public(p), reason=b.get("reason", ""), created_at=b["created_at"]))
        return out

    @router.post("/{other_id}", response_model=BlockOut)
    async def block(other_id: str, body: BlockBody, x_person_token: Optional[str] = Header(default=None)):
        me = await current_person(x_person_token)
        if other_id == me["id"]:
            raise HTTPException(400, "You can't block yourself")
        other = await db.people.find_one({"id": other_id}, PUBLIC_FIELDS)
        if not other:
            raise HTTPException(404, "Person not found")
        reason = " ".join(body.reason.split())
        doc = {"id": str(uuid.uuid4()), "blocker_id": me["id"], "blocked_id": other_id, "reason": reason, "created_at": _now()}
        await db.blocks.update_one({"blocker_id": me["id"], "blocked_id": other_id}, {"$setOnInsert": doc}, upsert=True)
        if body.report:
            await db.reports.insert_one({"id": str(uuid.uuid4()), "reporter_id": me["id"], "reported_id": other_id,
                                         "reason": reason, "created_at": _now()})
        await sever_requests(db, me["id"], other_id)
        saved = await db.blocks.find_one({"blocker_id": me["id"], "blocked_id": other_id}, {"_id": 0})
        return BlockOut(person=public(other), reason=saved.get("reason", ""), created_at=saved["created_at"])

    @router.delete("/{other_id}")
    async def unblock(other_id: str, x_person_token: Optional[str] = Header(default=None)):
        me = await current_person(x_person_token)
        res = await db.blocks.delete_one({"blocker_id": me["id"], "blocked_id": other_id})
        if not res.deleted_count:
            raise HTTPException(404, "This person isn't blocked")
        return {"ok": True}

    return router
