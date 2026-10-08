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
        "name": name, "phone": phone, "interests": ["ai-building"], "department": "CDAC",
        "accepts_location_requests": True, "verification_token": v["verification_token"]})
    assert r.status_code == 200, r.text
    return r.json()["person"]["id"], {"X-Person-Token": r.json()["token"]}


@pytest.fixture(scope="module")
def trio():
    suffix = str(int(time.time()))[-7:]
    return register("ZZTest Msg A", f"+9179{suffix}1"), register("ZZTest Msg B", f"+9179{suffix}2"), register("ZZTest Msg C", f"+9179{suffix}3")


def test_private_thread_between_two_people(trio):
    (aid, ha), (bid, hb), (cid, hc) = trio
    sent = requests.post(f"{API}/conversations/{bid}", json={"text": "  hello   B  "}, headers=ha)
    assert sent.status_code == 200
    assert sent.json()[0]["text"] == "hello B" and sent.json()[0]["mine"] is True

    # B sees it unread, then opens -> read
    assert requests.get(f"{API}/conversations/unread", headers=hb).json()["count"] == 1
    convos = requests.get(f"{API}/conversations", headers=hb).json()
    assert convos[0]["person"]["id"] == aid and convos[0]["unread"] == 1
    thread = requests.get(f"{API}/conversations/{aid}", headers=hb).json()
    assert [m["mine"] for m in thread["messages"]] == [False]
    assert requests.get(f"{API}/conversations/unread", headers=hb).json()["count"] == 0
    # A sees read receipt
    a_thread = requests.get(f"{API}/conversations/{bid}", headers=ha).json()
    assert a_thread["messages"][0]["read_at"] is not None

    # C cannot see anything between A and B
    assert requests.get(f"{API}/conversations", headers=hc).json() == []
    assert requests.get(f"{API}/conversations/{aid}", headers=hc).json()["messages"] == []
    assert requests.get(f"{API}/conversations/{bid}", headers=hc).json()["messages"] == []


def test_guards(trio):
    (aid, ha), _, _ = trio
    assert requests.post(f"{API}/conversations/{aid}", json={"text": "me"}, headers=ha).status_code == 400
    assert requests.post(f"{API}/conversations/nope", json={"text": "x"}, headers=ha).status_code == 404
    assert requests.post(f"{API}/conversations/{aid}", json={"text": "x"}).status_code == 401
    assert requests.post(f"{API}/conversations/{aid}", json={"text": "   "}, headers=ha).status_code in (400, 422)
