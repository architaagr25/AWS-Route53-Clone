"""Shared pytest fixtures.

Tests run against a throwaway SQLite file with demo-zone seeding disabled, so
each test starts from a clean database with only the admin user. These env vars
must be set before the app (and its engine) are imported.
"""
import os
import tempfile
from pathlib import Path

import pytest

_DB_FILE = Path(tempfile.mkdtemp()) / "test.db"
os.environ["DATABASE_URL"] = f"sqlite:///{_DB_FILE}"
os.environ["SEED_DEMO"] = "0"

from fastapi.testclient import TestClient  # noqa: E402

from app.database import Base, SessionLocal, engine  # noqa: E402
from app.main import app  # noqa: E402
from app.seed import seed  # noqa: E402


@pytest.fixture()
def client():
    """A TestClient backed by a freshly-reset database (admin user seeded)."""
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed(db)  # admin only (SEED_DEMO=0)
    finally:
        db.close()
    with TestClient(app) as c:
        yield c


@pytest.fixture()
def auth(client):
    """Authorization header for the seeded admin user."""
    res = client.post("/api/auth/login", json={"username": "admin", "password": "admin"})
    token = res.json()["token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture()
def zone(client, auth):
    """Create a hosted zone and return its JSON (starts with SOA + 2 NS records)."""
    return client.post(
        "/api/zones", headers=auth, json={"name": "example.com"}
    ).json()
