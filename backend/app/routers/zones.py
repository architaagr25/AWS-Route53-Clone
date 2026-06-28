"""Hosted Zone routes: CRUD + server-side search + pagination.

When a zone is created we auto-generate the SOA + 2 NS records that real
Route 53 creates, so a brand-new zone looks authentic instead of empty.
"""
import secrets
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from fastapi import Response

from ..auth import get_current_user
from ..bind import parse_bind_zone, records_to_bind, zone_to_json
from ..database import get_db
from ..models import DnsRecord, HostedZone, User
from ..schemas import ZoneCreate, ZoneList, ZoneOut, ZoneUpdate
from ..validation import ValidationError, validate_record

router = APIRouter(prefix="/api/zones", tags=["zones"])


def _get_zone_or_404(db: Session, zone_id: str) -> HostedZone:
    """Fetch a zone by id or raise 404 if it does not exist."""
    zone = db.query(HostedZone).filter(HostedZone.id == zone_id).first()
    if not zone:
        raise HTTPException(status_code=404, detail="Hosted zone not found")
    return zone


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


@router.get("/{zone_id}", response_model=ZoneOut)
def get_zone(
    zone_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """Fetch a single hosted zone by id."""
    return _get_zone_or_404(db, zone_id)


@router.put("/{zone_id}", response_model=ZoneOut)
def update_zone(
    zone_id: str,
    payload: ZoneUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """Edit an editable field of a zone. Like Route 53, only the comment is editable
    (the name and type of a zone are fixed once created)."""
    zone = _get_zone_or_404(db, zone_id)
    if payload.comment is not None:
        zone.comment = payload.comment
    db.commit()
    db.refresh(zone)
    return zone


@router.delete("/{zone_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_zone(
    zone_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """Delete a zone. Its records are removed automatically via the cascade
    relationship defined on the model (no orphaned records left behind)."""
    zone = _get_zone_or_404(db, zone_id)
    db.delete(zone)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/{zone_id}/import")
def import_bind(
    zone_id: str,
    body: dict,
    commit: bool = Query(False),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """Import records from a BIND zone file.

    With commit=false (default) returns a preview of the records that would be
    added plus any errors. With commit=true the valid records are persisted.
    SOA records in the file are skipped (the zone already has one).
    """
    zone = _get_zone_or_404(db, zone_id)
    content = (body or {}).get("content", "")
    if not content.strip():
        raise HTTPException(status_code=400, detail="Empty zone file")

    parsed, errors = parse_bind_zone(content, zone.name)

    valid = []
    for rec in parsed:
        if rec["type"] == "SOA":
            errors.append("SOA record skipped (the zone already has one)")
            continue
        try:
            validate_record(rec["type"], rec["value"])
            valid.append(rec)
        except ValidationError as e:
            errors.append(f"{rec['name']} {rec['type']}: {e}")

    if commit:
        for rec in valid:
            db.add(DnsRecord(zone_id=zone.id, **rec))
        db.flush()
        _refresh_count(db, zone)
        db.commit()
        return {"imported": len(valid), "errors": errors}

    return {"preview": valid, "count": len(valid), "errors": errors}


@router.get("/{zone_id}/export")
def export_zone(
    zone_id: str,
    format: str = Query("json", pattern="^(json|bind)$"),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """Export a zone and all of its records as JSON or a BIND zone file.

    Returns the file content with a Content-Disposition so browsers download it.
    """
    zone = _get_zone_or_404(db, zone_id)
    records = db.query(DnsRecord).filter(DnsRecord.zone_id == zone_id).all()
    base = zone.name.rstrip(".")

    if format == "bind":
        body = records_to_bind(zone, records)
        media, filename = "text/plain", f"{base}.zone"
    else:
        body = zone_to_json(zone, records)
        media, filename = "application/json", f"{base}.json"

    return Response(
        content=body,
        media_type=media,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
