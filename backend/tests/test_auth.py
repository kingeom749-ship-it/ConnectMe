"""Google (Emergent) auth: the OAuth hop itself can't run here, so sessions are seeded directly in Mongo."""
import os
import time
import uuid
from datetime import datetime, timedelta, timezone

import pytest
import requests
from dotenv import load_dotenv
from pymongo import MongoClient

load_dotenv("/app/frontend/.env")
load_dotenv("/app/backend/.env")
API = os.environ["REACT_APP_BACKEND_URL"] + "/api"
db = MongoClient(os.environ["MONGO_URL"])[os.environ["DB_NAME"]]


def seed_session(email, person_id=None, expired=False):
    token = f"test_session_{uuid.uuid4().hex}"
    exp = datetime.now(timezone.utc) + (timedelta(days=-1) if expired else timedelta(days=7))
    db.user_sessions.insert_one({"id": str(uuid.uuid4()), "session_token": token, "email": email, "name": "Goog Tester",
                                 "picture": "https://example.com/p.png", "person_id": person_id,
                                 "expires_at": exp.isoformat(), "created_at": datetime.now(timezone.utc).isoformat()})
    return token


@pytest.fixture(scope="module")
def suffix():
    return str(int(time.time()))[-7:]


def test_bogus_session_id_rejected():
    r = requests.post(f"{API}/auth/google/session", json={"session_id": "bogus"})
    assert r.status_code == 401


def test_me_requires_session():
    assert requests.get(f"{API}/auth/me").status_code == 401
    assert requests.get(f"{API}/auth/me", headers={"Authorization": "Bearer nope"}).status_code == 401


def test_google_registration_links_person(suffix):
    email = f"goog.{suffix}@example.com"
    pending = seed_session(email)
    # unfinished Google user -> registration_required
    r = requests.get(f"{API}/auth/me", headers={"Authorization": f"Bearer {pending}"})
    assert r.status_code == 409 and r.json()["detail"] == "registration_required"

    phone = f"+9174{suffix}1"
    sent = requests.post(f"{API}/otp/send", json={"phone": phone}).json()
    v = requests.post(f"{API}/otp/verify", json={"phone": phone, "code": sent["demo_code"]}).json()
    r = requests.post(f"{API}/people", json={
        "name": "Goog Tester", "phone": phone, "interests": ["photography"], "department": "MBA",
        "accepts_location_requests": False, "verification_token": v["verification_token"], "google_session_token": pending})
    assert r.status_code == 200, r.text
    person = r.json()["person"]
    assert person["picture"] == "https://example.com/p.png"

    # the session token now acts as a login: /auth/me via header and cookie, and as X-Person-Token
    for headers in ({"Authorization": f"Bearer {pending}"}, {"Cookie": f"session_token={pending}"}):
        me = requests.get(f"{API}/auth/me", headers=headers)
        assert me.status_code == 200 and me.json()["person"]["id"] == person["id"]
    assert requests.get(f"{API}/me", headers={"X-Person-Token": pending}).json()["id"] == person["id"]

    # a second Google session for the same email maps straight to the person
    again = seed_session(email, person_id=person["id"])
    assert requests.get(f"{API}/auth/me", headers={"Authorization": f"Bearer {again}"}).json()["person"]["id"] == person["id"]

    # re-using an already linked session for another registration is refused
    phone2 = f"+9174{suffix}2"
    sent = requests.post(f"{API}/otp/send", json={"phone": phone2}).json()
    v = requests.post(f"{API}/otp/verify", json={"phone": phone2, "code": sent["demo_code"]}).json()
    r = requests.post(f"{API}/people", json={
        "name": "Other One", "phone": phone2, "interests": ["gaming"], "department": "BE",
        "accepts_location_requests": False, "verification_token": v["verification_token"], "google_session_token": pending})
    assert r.status_code == 409

    # expired sessions and logout
    old = seed_session(email, person_id=person["id"], expired=True)
    assert requests.get(f"{API}/auth/me", headers={"Authorization": f"Bearer {old}"}).status_code == 401
    assert requests.post(f"{API}/auth/logout", headers={"Authorization": f"Bearer {again}"}).status_code == 200
    assert requests.get(f"{API}/auth/me", headers={"Authorization": f"Bearer {again}"}).status_code == 401
