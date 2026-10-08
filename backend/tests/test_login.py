import os
import time

import requests
from dotenv import load_dotenv

load_dotenv("/app/frontend/.env")
API = os.environ["REACT_APP_BACKEND_URL"] + "/api"


def otp(phone, purpose):
    sent = requests.post(f"{API}/otp/send", json={"phone": phone, "purpose": purpose})
    assert sent.status_code == 200, sent.text
    return requests.post(f"{API}/otp/verify", json={"phone": phone, "code": sent.json()["demo_code"]}).json()["verification_token"]


def test_phone_login_flow():
    phone = f"+9171{str(int(time.time()))[-7:]}1"
    # login before registering is refused
    assert requests.post(f"{API}/otp/send", json={"phone": phone, "purpose": "login"}).status_code == 404

    r = requests.post(f"{API}/people", json={"name": "ZZTest Login", "phone": phone, "interests": ["gaming"], "department": "BE",
                                               "accepts_location_requests": True, "verification_token": otp(phone, "register")})
    assert r.status_code == 200, r.text
    pid, first_token = r.json()["person"]["id"], r.json()["token"]

    # registering the same number again is refused, but login works and yields a second device token
    assert requests.post(f"{API}/otp/send", json={"phone": phone, "purpose": "register"}).status_code == 409
    time.sleep(0.1)
    login = requests.post(f"{API}/auth/login", json={"phone": phone, "verification_token": otp(phone, "login")})
    assert login.status_code == 200, login.text
    token2 = login.json()["token"]
    assert login.json()["person"]["id"] == pid and token2 != first_token

    # both devices stay signed in
    for t in (first_token, token2):
        assert requests.get(f"{API}/me", headers={"X-Person-Token": t}).json()["id"] == pid
    assert requests.get(f"{API}/auth/me", headers={"Authorization": f"Bearer {token2}"}).json()["person"]["id"] == pid

    # a verification token can't be reused, and a bad one is refused
    assert requests.post(f"{API}/auth/login", json={"phone": phone, "verification_token": "nope"}).status_code == 403

    # logout only kills that device
    requests.post(f"{API}/auth/logout", headers={"Authorization": f"Bearer {token2}"})
    assert requests.get(f"{API}/me", headers={"X-Person-Token": token2}).status_code == 401
    assert requests.get(f"{API}/me", headers={"X-Person-Token": first_token}).status_code == 200
