import os
import time

import requests
from dotenv import load_dotenv

load_dotenv("/app/frontend/.env")
API = os.environ["REACT_APP_BACKEND_URL"] + "/api"


def register(name, phone):
    sent = requests.post(f"{API}/otp/send", json={"phone": phone}).json()
    v = requests.post(f"{API}/otp/verify", json={"phone": phone, "code": sent["demo_code"]}).json()
    r = requests.post(f"{API}/people", json={
        "name": name, "phone": phone, "interests": ["gaming"], "department": "BE",
        "accepts_location_requests": True, "verification_token": v["verification_token"]})
    assert r.status_code == 200, r.text
    return r.json()["person"]["id"], {"X-Person-Token": r.json()["token"]}


def test_profile_update():
    pid, h = register("ZZTest Edit Me", f"+9172{str(int(time.time()))[-7:]}1")
    r = requests.patch(f"{API}/me", json={"name": "  ZZTest Edited   Name ", "interests": ["anime", "ANIME", "run-club"],
                                            "department": "MBA", "accepts_location_requests": False,
                                            "picture": "data:image/jpeg;base64,/9j/4AAQSkZJRg=="}, headers=h)
    assert r.status_code == 200, r.text
    me = r.json()
    assert me["name"] == "ZZTest Edited Name" and me["interests"] == ["anime", "run-club"] and me["department"] == "MBA"
    assert me["accepts_location_requests"] is False and me["picture"].startswith("data:image/jpeg;base64,")

    # reflected in the public directory
    pub = next(p for p in requests.get(f"{API}/people?q=ZZTest Edited").json() if p["id"] == pid)
    assert pub["name"] == "ZZTest Edited Name" and pub["picture"] == me["picture"] and "phone" not in pub

    # validation
    assert requests.patch(f"{API}/me", json={"interests": []}, headers=h).status_code == 422
    assert requests.patch(f"{API}/me", json={"interests": ["nope"]}, headers=h).status_code == 422
    assert requests.patch(f"{API}/me", json={"department": "Law"}, headers=h).status_code == 422
    assert requests.patch(f"{API}/me", json={"picture": "javascript:alert(1)"}, headers=h).status_code == 422
    assert requests.patch(f"{API}/me", json={"picture": "data:image/jpeg;base64," + "A" * 500_000}, headers=h).status_code == 422
    assert requests.patch(f"{API}/me", json={}, headers=h).status_code == 400
    assert requests.patch(f"{API}/me", json={"name": "No Token"}).status_code == 401

    # phone cannot be changed through this endpoint
    r = requests.patch(f"{API}/me", json={"phone": "+911111111111", "picture": ""}, headers=h)
    assert r.status_code == 200 and r.json()["phone"] != "+911111111111" and r.json()["picture"] == ""
