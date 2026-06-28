"""Hosted Zone routes: CRUD + server-side search + pagination.

When a zone is created we auto-generate the SOA + 2 NS records that real
Route 53 creates, so a brand-new zone looks authentic instead of empty.
"""
import secrets
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..database import get_db
from ..models import DnsRecord, HostedZone, User
from ..schemas import ZoneCreate, ZoneList, ZoneOut

router = APIRouter(prefix="/api/zones", tags=["zones"])


def _default_records(zone: HostedZone) -> list[DnsRecord]:
    """Build the SOA + 2 NS records AWS creates for a new hosted zone."""
    ns_hosts = [
        f"ns-{secrets.randbelow(2048)}.awsdns-{secrets.randbelow(64):02d}.com.",
        f"ns-{secrets.randbelow(2048)}.awsdns-{secrets.randbelow(64):02d}.org.",
    ]
    soa_value = (
        f"{ns_hosts[0]} awsdns-hostmaster.amazon.com. 1 7200 900 1209600 86400"
    )
    return [
        DnsRecord(zone_id=zone.id, name=zone.name, type="NS",
                  value="\n".join(ns_hosts), ttl=172800),
        DnsRecord(zone_id=zone.id, name=zone.name, type="SOA",
                  value=soa_value, ttl=900),
    ]


def _refresh_count(db: Session, zone: HostedZone) -> None:
    """Recompute and store the zone's record_count."""
    zone.record_count = (
        db.query(func.count(DnsRecord.id))
        .filter(DnsRecord.zone_id == zone.id)
        .scalar()
    )


@router.get("", response_model=ZoneList)
def list_zones(
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """List hosted zones, newest first, with optional name search + pagination."""
    query = db.query(HostedZone)
    if search:
        like = f"%{search.strip().lower()}%"
        query = query.filter(func.lower(HostedZone.name).like(like))
    total = query.count()
    items = (
        query.order_by(HostedZone.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return ZoneList(items=items, total=total, page=page, page_size=page_size)


@router.post("", response_model=ZoneOut, status_code=status.HTTP_201_CREATED)
def create_zone(
    payload: ZoneCreate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """Create a hosted zone and its starter SOA + NS records."""
    existing = db.query(HostedZone).filter(HostedZone.name == payload.name).first()
    if existing:
        raise HTTPException(status_code=409,
                            detail="A hosted zone with this name already exists")
    zone = HostedZone(name=payload.name, type=payload.type, comment=payload.comment)
    db.add(zone)
    db.flush()  # assigns zone.id before we build its default records
    for rec in _default_records(zone):
        db.add(rec)
    db.flush()
    _refresh_count(db, zone)
    db.commit()
    db.refresh(zone)
    return zone
