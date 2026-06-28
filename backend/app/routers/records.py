"""DNS Record routes: CRUD + search + type filter + pagination.

Records live inside a hosted zone, so the list/create routes are nested under
a zone id (/api/zones/{zone_id}/records), while update/delete act on a record
id directly (/api/records/{record_id}).
"""
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..database import get_db
from ..models import DnsRecord, HostedZone, User
from ..schemas import (
    BulkDeleteRequest,
    BulkResult,
    RecordCreate,
    RecordList,
    RecordOut,
    RecordUpdate,
)
from ..validation import ValidationError, validate_record

router = APIRouter(prefix="/api", tags=["records"])


def _get_zone_or_404(db: Session, zone_id: str) -> HostedZone:
    zone = db.query(HostedZone).filter(HostedZone.id == zone_id).first()
    if not zone:
        raise HTTPException(status_code=404, detail="Hosted zone not found")
    return zone


def _refresh_count(db: Session, zone_id: str) -> None:
    zone = db.query(HostedZone).filter(HostedZone.id == zone_id).first()
    if zone:
        zone.record_count = (
            db.query(func.count(DnsRecord.id))
            .filter(DnsRecord.zone_id == zone_id)
            .scalar()
        )


def _normalize_name(name: str, zone_name: str) -> str:
    """Resolve a record name to a fully-qualified name within its zone.

    Accepts the conveniences DNS users expect:
      ''  or '@'      -> the zone apex (example.com.)
      'www'           -> www.example.com.   (subdomain relative to the zone)
      'www.example.com.' (already FQDN) -> kept as-is
    """
    name = name.strip()
    if name in ("", "@"):
        return zone_name
    if name.endswith("."):
        return name.lower()
    base = zone_name.rstrip(".")
    if name.lower().endswith(base.lower()):
        return name.lower() + "."
    return f"{name}.{zone_name}".lower()


@router.get("/zones/{zone_id}/records", response_model=RecordList)
def list_records(
    zone_id: str,
    search: Optional[str] = None,
    type: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """List a zone's records with optional search, type filter, and pagination."""
    _get_zone_or_404(db, zone_id)
    query = db.query(DnsRecord).filter(DnsRecord.zone_id == zone_id)
    if type:
        query = query.filter(DnsRecord.type == type.upper())
    if search:
        # Search by record name only (matches the real Route 53 console).
        like = f"%{search.strip().lower()}%"
        query = query.filter(func.lower(DnsRecord.name).like(like))
    total = query.count()
    items = (
        query.order_by(DnsRecord.name.asc(), DnsRecord.type.asc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return RecordList(items=items, total=total, page=page, page_size=page_size)


@router.post(
    "/zones/{zone_id}/records",
    response_model=RecordOut,
    status_code=status.HTTP_201_CREATED,
)
def create_record(
    zone_id: str,
    payload: RecordCreate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """Create a DNS record after validating its value against its type."""
    zone = _get_zone_or_404(db, zone_id)
    try:
        payload.run_value_validation()  # per-type DNS value rules
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    record = DnsRecord(
        zone_id=zone.id,
        name=_normalize_name(payload.name, zone.name),
        type=payload.type,
        value=payload.value.strip(),
        ttl=payload.ttl,
        routing_policy=payload.routing_policy,
    )
    db.add(record)
    db.flush()
    _refresh_count(db, zone_id)
    db.commit()
    db.refresh(record)
    return record


def _get_record_or_404(db: Session, record_id: int) -> DnsRecord:
    record = db.query(DnsRecord).filter(DnsRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    return record


@router.put("/records/{record_id}", response_model=RecordOut)
def update_record(
    record_id: int,
    payload: RecordUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """Edit a record. The type is fixed once created (matching Route 53); a new
    value is re-validated against that existing type before saving."""
    record = _get_record_or_404(db, record_id)
    zone = db.query(HostedZone).filter(HostedZone.id == record.zone_id).first()

    if payload.value is not None:
        try:
            validate_record(record.type, payload.value)
        except ValidationError as e:
            raise HTTPException(status_code=422, detail=str(e))
        record.value = payload.value.strip()
    if payload.name is not None:
        record.name = _normalize_name(payload.name, zone.name)
    if payload.ttl is not None:
        record.ttl = payload.ttl
    if payload.routing_policy is not None:
        record.routing_policy = payload.routing_policy

    db.commit()
    db.refresh(record)
    return record


@router.delete("/records/{record_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_record(
    record_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """Delete a record. The system SOA record cannot be deleted (as in Route 53)."""
    record = _get_record_or_404(db, record_id)
    if record.type == "SOA":
        raise HTTPException(
            status_code=400, detail="The SOA record cannot be deleted"
        )
    zone_id = record.zone_id
    db.delete(record)
    db.flush()
    _refresh_count(db, zone_id)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/zones/{zone_id}/records/bulk-delete", response_model=BulkResult)
def bulk_delete_records(
    zone_id: str,
    payload: BulkDeleteRequest,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """Delete many records in one request. The SOA record is skipped (it cannot
    be deleted), and the result reports how many were deleted plus any skips."""
    _get_zone_or_404(db, zone_id)
    result = BulkResult()
    found = (
        db.query(DnsRecord)
        .filter(DnsRecord.zone_id == zone_id, DnsRecord.id.in_(payload.ids))
        .all()
    )
    for record in found:
        if record.type == "SOA":
            result.errors.append("The SOA record cannot be deleted")
            continue
        db.delete(record)
        result.deleted += 1
    db.flush()
    _refresh_count(db, zone_id)
    db.commit()
    return result
