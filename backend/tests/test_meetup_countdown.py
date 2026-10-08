import os
import time

import pytest
import requests
from dotenv import load_dotenv

load_dotenv("/app/frontend/.env")
API = os.environ["REACT_APP_BACKEND_URL"] + "/api"


def register(name, phone, accepts=True):
    sent = requests.post(f"{API}/otp/send", json={"phone": phone}).json()
    assert sent["mode"] == "demo", sent
    v = requests.post(f"{API}/otp/verify", json={"phone": phone, "code": sent["demo_code"]}).json()
    r = requests.post(f"{API}/people", json={
        "name": name, "phone": phone, "interests": ["gaming"], "department": "MBA",
        "accepts_location_requests": accepts, "verification_token": v["verification_token"]})
    assert r.status_code == 200, r.text
    return r.json()["token"]


@pytest.fixture(scope="module")
def pair():
    suffix = str(int(time.time()))[-7:]
    a = register("ZZTest Countdown A", f"+9177{suffix}1")
    b = register("ZZTest Countdown B", f"+9177{suffix}2")
    return a, b


def test_meetup_accept_sets_timer(pair):
    a, b = pair
    ha, hb = {"X-Person-Token": a}, {"X-Person-Token": b}
    me_b = requests.get(f"{API}/me", headers=hb).json()
    req = requests.post(f"{API}/location-requests", json={"target_id": me_b["id"], "note": "hi"}, headers=ha).json()
    shared = requests.post(f"{API}/location-requests/{req['id']}/respond",
                           json={"accept": True, "lat": 18.5204, "lng": 73.8567, "accuracy": 50}, headers=hb).json()
    assert shared["status"] == "shared"
    prop = requests.post(f"{API}/location-requests/{req['id']}/meetup",
                         json={"lat": 18.5250, "lng": 73.8600, "label": "Library steps"}, headers=ha).json()
    assert prop["meetup"]["status"] == "proposed" and prop["meetup"]["meet_at"] is None
    assert prop["contact_phone"] is None  # hidden until both confirm
    acc = requests.post(f"{API}/location-requests/{req['id']}/meetup/respond", json={"accept": True}, headers=hb).json()
    m = acc["meetup"]
    assert m["status"] == "accepted" and m["accepted_at"] and m["meet_at"]
    assert m["meet_at"] > m["accepted_at"]
    me_a = requests.get(f"{API}/me", headers=ha).json()
    assert acc["contact_phone"] == me_a["phone"]  # B now sees A's number
    # both parties see the same timer and the counterpart's number
    inbox_a = requests.get(f"{API}/location-requests", headers=ha).json()
    out = next(x for x in inbox_a["outgoing"] if x["id"] == req["id"])
    assert out["meetup"]["meet_at"] == m["meet_at"]
    assert out["contact_phone"] == me_b["phone"]


def test_meta_exposes_otp_mode():
    meta = requests.get(f"{API}/meta").json()
    assert meta["otp_mode"] in ("sms", "demo")
