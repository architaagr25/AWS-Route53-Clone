"""Seed baseline data so the app is usable on first run.

For now this just ensures a demo login account exists. In Step 9 we expand this
to also create a few realistic hosted zones and records.
"""
from sqlalchemy.orm import Session

from .models import User

# Demo credentials shown on the login screen.
DEMO_USERNAME = "admin"
DEMO_PASSWORD = "admin"


def seed(db: Session) -> None:
    """Idempotent: only creates the demo user if no users exist yet."""
    if db.query(User).count() == 0:
        db.add(User(username=DEMO_USERNAME, password=DEMO_PASSWORD))
        db.commit()
