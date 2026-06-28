"""DNS Record routes: CRUD + search + type filter + pagination.

Records live inside a hosted zone, so the list/create routes are nested under
a zone id (/api/zones/{zone_id}/records), while update/delete act on a record
id directly (/api/records/{record_id}).
"""
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..database import get_db
from ..models import DnsRecord, HostedZone, User
from ..schemas import RecordCreate, RecordList, RecordOut

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
        like = f"%{search.strip().lower()}%"
        query = query.filter(
            or_(
                func.lower(DnsRecord.name).like(like),
                func.lower(DnsRecord.value).like(like),
            )
        )
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
        payload.run_value_validation()  # per-type DNS rules from Step 5
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
