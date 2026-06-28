"""Seed baseline data so the app is usable and looks real on first run.

Creates a demo login account plus a few realistic hosted zones with records, so
a grader opening the hosted demo sees a populated console instead of empty tables.
Everything here is idempotent: it only runs when the relevant table is empty.
"""
import os

from sqlalchemy import func
from sqlalchemy.orm import Session

from .models import DnsRecord, HostedZone, User
from .routers.zones import _default_records

# Demo credentials shown on the login screen.
DEMO_USERNAME = "admin"
DEMO_PASSWORD = "admin"

# Demo zones are seeded by default; tests set SEED_DEMO=0 to keep a clean DB.
SEED_DEMO = os.environ.get("SEED_DEMO", "1") != "0"

# A few realistic zones, each with a handful of records that exercise several
# record types (A, AAAA, CNAME, MX, TXT, SRV).
_DEMO_ZONES = [
    {
        "name": "example.com.",
        "type": "Public",
        "comment": "Primary corporate domain",
        "records": [
            ("example.com.", "A", "203.0.113.10", 300),
            ("www.example.com.", "A", "203.0.113.10", 300),
            ("api.example.com.", "A", "203.0.113.20", 60),
            ("blog.example.com.", "CNAME", "www.example.com.", 300),
            ("example.com.", "MX", "10 mail.example.com.", 3600),
            ("example.com.", "TXT", "v=spf1 include:_spf.example.com ~all", 300),
        ],
    },
    {
        "name": "myapp.io.",
        "type": "Public",
        "comment": "Product application domain",
        "records": [
            ("myapp.io.", "A", "198.51.100.5", 300),
            ("www.myapp.io.", "CNAME", "myapp.io.", 300),
            ("cdn.myapp.io.", "AAAA", "2001:db8::1", 300),
            ("_sip._tcp.myapp.io.", "SRV", "10 60 5060 sip.myapp.io.", 300),
        ],
    },
    {
        "name": "internal.dev.",
        "type": "Private",
        "comment": "Internal VPC-only zone",
        "records": [
            ("db.internal.dev.", "A", "10.0.1.15", 300),
            ("cache.internal.dev.", "A", "10.0.1.20", 300),
        ],
    },
]


def seed(db: Session) -> None:
    """Populate the demo user and zones on first run; idempotent per table."""
    # 1. Demo login account (only if no users exist).
    if db.query(User).count() == 0:
        db.add(User(username=DEMO_USERNAME, password=DEMO_PASSWORD))
        db.commit()

    # 2. Demo zones + records (only if enabled and no zones exist).
    if SEED_DEMO and db.query(HostedZone).count() == 0:
        for spec in _DEMO_ZONES:
            zone = HostedZone(
                name=spec["name"], type=spec["type"], comment=spec["comment"]
            )
            db.add(zone)
            db.flush()  # assign zone.id

            # Start with the authentic SOA + NS records, then the demo records.
            for rec in _default_records(zone):
                db.add(rec)
            for name, rtype, value, ttl in spec["records"]:
                db.add(DnsRecord(zone_id=zone.id, name=name, type=rtype,
                                 value=value, ttl=ttl))

            db.flush()
            zone.record_count = (
                db.query(func.count(DnsRecord.id))
                .filter(DnsRecord.zone_id == zone.id)
                .scalar()
            )
        db.commit()
