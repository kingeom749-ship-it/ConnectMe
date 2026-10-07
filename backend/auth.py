"""Emergent-managed Google sign-in.

Flow: frontend redirects to auth.emergentagent.com -> lands on /auth/callback#session_id=...
-> POST /api/auth/google/session exchanges it (server-side) for the Google profile + session_token
-> we store the session in `user_sessions` and map it to a `people` document by google_email.
If no person exists yet, the Google user finishes the normal registration (phone OTP, interests...)
and POST /api/people links the pending session via `google_session_token`.
"""
import logging
import uuid
from datetime import datetime, timedelta, timezone
from typing import Callable, Optional

import httpx
from fastapi import APIRouter, Header, HTTPException, Request, Response
from pydantic import BaseModel

logger = logging.getLogger("auth")

SESSION_DATA_URL = "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data"
SESSION_TTL = timedelta(days=7)
COOKIE = "session_token"


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _expired(value) -> bool:
    exp = datetime.fromisoformat(value) if isinstance(value, str) else value
    if exp.tzinfo is None:
        exp = exp.replace(tzinfo=timezone.utc)
    return exp < _now()


async def session_person(db, token: str) -> Optional[dict]:
    """Resolve a Google session token to its linked person (or None)."""
    sess = await db.user_sessions.find_one({"session_token": token}, {"_id": 0})
    if not sess or _expired(sess["expires_at"]) or not sess.get("person_id"):
        return None
    return await db.people.find_one({"id": sess["person_id"]}, {"_id": 0})


async def pending_session(db, token: Optional[str]) -> Optional[dict]:
    """Validate a not-yet-linked Google session before registration (returns the session or None)."""
    if not token:
        return None
    sess = await db.user_sessions.find_one({"session_token": token}, {"_id": 0})
    if not sess or _expired(sess["expires_at"]):
        raise HTTPException(401, "Your Google sign-in expired. Please sign in again.")
    if sess.get("person_id"):
        raise HTTPException(409, "This Google account is already linked to a profile")
    if await db.people.find_one({"google_email": sess["email"]}, {"_id": 1}):
        raise HTTPException(409, "This Google account is already linked to a profile")
    return sess


async def link_session(db, token: str, person_id: str) -> None:
    await db.user_sessions.update_one({"session_token": token}, {"$set": {"person_id": person_id}})


class SessionBody(BaseModel):
    session_id: str


def _token_from(request: Request, authorization: Optional[str]) -> Optional[str]:
    if request.cookies.get(COOKIE):
        return request.cookies[COOKIE]
    if authorization and authorization.lower().startswith("bearer "):
        return authorization.split(" ", 1)[1].strip()
    return None


def _set_cookie(response: Response, token: str) -> None:
    response.set_cookie(COOKIE, token, max_age=int(SESSION_TTL.total_seconds()), httponly=True, secure=True, samesite="none", path="/")


def build_auth_router(db, me_model) -> APIRouter:
    router = APIRouter(prefix="/api/auth")

    @router.post("/google/session")
    async def google_session(body: SessionBody, response: Response):
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                r = await client.get(SESSION_DATA_URL, headers={"X-Session-ID": body.session_id})
        except httpx.HTTPError as e:
            logger.warning("Emergent auth unreachable: %s", e)
            raise HTTPException(502, "Google sign-in is unavailable right now. Try again shortly.")
        if r.status_code != 200:
            raise HTTPException(401, "Google sign-in could not be verified. Please try again.")
        data = r.json()
        email = data["email"].lower()
        person = await db.people.find_one({"google_email": email}, {"_id": 0})
        sess = {
            "id": str(uuid.uuid4()), "session_token": data["session_token"], "email": email, "name": data.get("name", ""),
            "picture": data.get("picture", ""), "person_id": person["id"] if person else None,
            "expires_at": (_now() + SESSION_TTL).isoformat(), "created_at": _now().isoformat(),
        }
        await db.user_sessions.update_one({"session_token": sess["session_token"]}, {"$set": sess}, upsert=True)
        if person and data.get("picture") and person.get("picture") != data["picture"]:
            await db.people.update_one({"id": person["id"]}, {"$set": {"picture": data["picture"]}})
        _set_cookie(response, sess["session_token"])
        if person:
            return {"status": "signed_in", "person": me_model.from_mongo(person), "token": sess["session_token"]}
        return {"status": "needs_registration", "email": email, "name": sess["name"], "picture": sess["picture"],
                "session_token": sess["session_token"]}

    @router.get("/me")
    async def auth_me(request: Request, authorization: Optional[str] = Header(default=None)):
        token = _token_from(request, authorization)
        if not token:
            raise HTTPException(401, "Not signed in")
        sess = await db.user_sessions.find_one({"session_token": token}, {"_id": 0})
        if not sess or _expired(sess["expires_at"]):
            raise HTTPException(401, "Session expired")
        if not sess.get("person_id"):
            raise HTTPException(409, "registration_required")
        person = await db.people.find_one({"id": sess["person_id"]}, {"_id": 0})
        if not person:
            raise HTTPException(401, "Profile not found")
        return {"person": me_model.from_mongo(person), "token": token}

    @router.post("/logout")
    async def logout(request: Request, response: Response, authorization: Optional[str] = Header(default=None),
                     x_person_token: Optional[str] = Header(default=None)):
        token = _token_from(request, authorization) or x_person_token
        if token:
            await db.user_sessions.delete_one({"session_token": token})
        response.delete_cookie(COOKIE, path="/", secure=True, samesite="none")
        return {"ok": True}

    return router
