"""Every test account is named with the ZZTest prefix; this fixture wipes them (and their data) after the run."""
import os

import pytest
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


@pytest.fixture(scope="session", autouse=True)
def cleanup_test_accounts():
    yield
    purge_test_accounts()
