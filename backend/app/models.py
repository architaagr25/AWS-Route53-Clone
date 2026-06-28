"""ORM models — the database tables, expressed as Python classes.

Three tables:
- User        : mocked auth accounts
- HostedZone  : a domain you manage (e.g. example.com.)  -> Route 53 "Hosted Zone"
- DnsRecord   : a DNS entry inside a zone (e.g. www -> 1.2.3.4)

A HostedZone has many DnsRecords (one-to-many). Deleting a zone deletes its records.
"""
import secrets
import string
from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from .database import Base


def _utcnow() -> datetime:
    """Timezone-aware UTC timestamp used for created_at defaults."""
    return datetime.now(timezone.utc)


def generate_zone_id() -> str:
    """AWS-style hosted zone id: 'Z' followed by 13 uppercase alphanumerics.

    Real Route 53 ids look like 'Z1D633PJN98FT9'. We mimic that so the UI feels
    authentic instead of showing a plain integer.
    """
    alphabet = string.ascii_uppercase + string.digits
    return "Z" + "".join(secrets.choice(alphabet) for _ in range(13))


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, nullable=False, index=True)
    password = Column(String, nullable=False)  # plaintext mock — demo only
    created_at = Column(DateTime, default=_utcnow)


class HostedZone(Base):
    __tablename__ = "hosted_zones"

    # String primary key shaped like a real Route 53 zone id.
    id = Column(String, primary_key=True, default=generate_zone_id)
    name = Column(String, nullable=False, index=True)        # e.g. "example.com."
    type = Column(String, nullable=False, default="Public")  # Public | Private
    comment = Column(Text, default="")
    record_count = Column(Integer, default=0)                # kept in sync on writes
    created_at = Column(DateTime, default=_utcnow)

    # One zone -> many records. cascade + delete-orphan means deleting a zone
    # also deletes all of its records (no orphaned rows left behind).
    records = relationship(
        "DnsRecord",
        back_populates="zone",
        cascade="all, delete-orphan",
    )


class DnsRecord(Base):
    __tablename__ = "dns_records"

    id = Column(Integer, primary_key=True, index=True)
    # Foreign key linking this record to its zone. ondelete="CASCADE" enforces
    # the cleanup at the database level too.
    zone_id = Column(
        String,
        ForeignKey("hosted_zones.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name = Column(String, nullable=False, index=True)   # e.g. "www.example.com."
    type = Column(String, nullable=False, index=True)   # A, AAAA, CNAME, ...
    value = Column(Text, nullable=False)                # newline-separated if multi-value
    ttl = Column(Integer, default=300)                  # time-to-live, seconds
    routing_policy = Column(String, default="Simple")
    created_at = Column(DateTime, default=_utcnow)

    zone = relationship("HostedZone", back_populates="records")
