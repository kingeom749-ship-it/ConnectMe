import os
import time

import pytest
import requests
from dotenv import load_dotenv

load_dotenv("/app/frontend/.env")
API = os.environ["REACT_APP_BACKEND_URL"] + "/api"


def register(name, phone):
    sent = requests.post(f"{API}/otp/send", json={"phone": phone}).json()
    v = requests.post(f"{API}/otp/verify", json={"phone": phone, "code": sent["demo_code"]}).json()
    r = requests.post(f"{API}/people", json={
        "name": name, "phone": phone, "interests": ["run-club"], "department": "BE",
        "accepts_location_requests": True, "verification_token": v["verification_token"]})
    assert r.status_code == 200, r.text
    return r.json()["person"]["id"], {"X-Person-Token": r.json()["token"]}


@pytest.fixture(scope="module")
def pair():
    suffix = str(int(time.time()))[-7:]
    return register("Blk A", f"+9175{suffix}1"), register("Blk B", f"+9175{suffix}2")


def test_block_flow(pair):
    (aid, ha), (bid, hb) = pair
    # a message and a shared location exist before the block
    requests.post(f"{API}/conversations/{aid}", json={"text": "hey"}, headers=hb)
    req = requests.post(f"{API}/location-requests", json={"target_id": aid, "note": ""}, headers=hb).json()
    requests.post(f"{API}/location-requests/{req['id']}/respond", json={"accept": True, "lat": 18.5, "lng": 73.8, "accuracy": 50}, headers=ha)

    blk = requests.post(f"{API}/blocks/{bid}", json={"reason": "Spam or scam", "report": True}, headers=ha)
    assert blk.status_code == 200 and blk.json()["person"]["id"] == bid

    # B can no longer message or request A; A can't either until unblocking
    assert requests.post(f"{API}/conversations/{aid}", json={"text": "still there?"}, headers=hb).status_code == 403
    assert requests.post(f"{API}/location-requests", json={"target_id": aid, "note": ""}, headers=hb).status_code == 403
    assert requests.post(f"{API}/conversations/{bid}", json={"text": "x"}, headers=ha).status_code == 403

    # sharing got revoked
    inbox_a = requests.get(f"{API}/location-requests", headers=ha).json()
    assert next(r for r in inbox_a["incoming"] if r["id"] == req["id"])["status"] == "revoked"

    # hidden from each other's directory and conversation lists; thread exposes state
    assert bid not in {p["id"] for p in requests.get(f"{API}/people", headers=ha).json()}
    assert aid not in {p["id"] for p in requests.get(f"{API}/people", headers=hb).json()}
    assert aid in {p["id"] for p in requests.get(f"{API}/people").json()}  # anonymous still sees everyone
    assert all(c["person"]["id"] != bid for c in requests.get(f"{API}/conversations", headers=ha).json())
    assert requests.get(f"{API}/conversations/unread", headers=ha).json()["count"] == 0
    t = requests.get(f"{API}/conversations/{bid}", headers=ha).json()
    assert t["blocked_by_me"] is True and t["blocked_me"] is False
    t = requests.get(f"{API}/conversations/{aid}", headers=hb).json()
    assert t["blocked_by_me"] is False and t["blocked_me"] is True

    blocks = requests.get(f"{API}/blocks", headers=ha).json()
    assert [b["person"]["id"] for b in blocks] == [bid] and blocks[0]["reason"] == "Spam or scam"

    # unblock restores contact
    assert requests.delete(f"{API}/blocks/{bid}", headers=ha).status_code == 200
    assert requests.delete(f"{API}/blocks/{bid}", headers=ha).status_code == 404
    assert requests.post(f"{API}/conversations/{aid}", json={"text": "back"}, headers=hb).status_code == 200


def test_block_guards(pair):
    (aid, ha), _ = pair
    assert requests.post(f"{API}/blocks/{aid}", json={}, headers=ha).status_code == 400
    assert requests.post(f"{API}/blocks/nope", json={}, headers=ha).status_code == 404
    assert requests.post(f"{API}/blocks/{aid}", json={}).status_code == 401
