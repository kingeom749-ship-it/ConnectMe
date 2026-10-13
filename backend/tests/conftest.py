"""Every test account is named with the ZZTest prefix; the controller process wipes them (and their data) once the
whole run is over. (Doing it per xdist worker would delete accounts other workers are still using.)"""
import os

from dotenv import load_dotenv
from pymongo import MongoClient

load_dotenv("/app/backend/.env")

TEST_PREFIX = "ZZTest "


def purge_test_accounts():
    db = MongoClient(os.environ["MONGO_URL"])[os.environ["DB_NAME"]]
    ids = [p["id"] for p in db.people.find({"name": {"$regex": f"^{TEST_PREFIX}"}}, {"id": 1})]
    if not ids:
        return
    db.people.delete_many({"id": {"$in": ids}})
    db.location_requests.delete_many({"$or": [{"requester_id": {"$in": ids}}, {"target_id": {"$in": ids}}]})
    db.messages.delete_many({"participants": {"$in": ids}})
    db.blocks.delete_many({"$or": [{"blocker_id": {"$in": ids}}, {"blocked_id": {"$in": ids}}]})
    db.user_sessions.delete_many({"person_id": {"$in": ids}})
    db.reports.delete_many({"$or": [{"reporter_id": {"$in": ids}}, {"reported_id": {"$in": ids}}]})


def pytest_sessionfinish(session, exitstatus):
    if hasattr(session.config, "workerinput"):
        return  # xdist worker — the controller cleans up after everyone
    purge_test_accounts()
