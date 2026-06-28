"""Pydantic schemas — the shapes of API requests and responses.

Two jobs:
1. Validation: incoming JSON is checked against these models before any route
   code runs (bad types, missing fields, and our DNS rules are rejected here).
2. Serialization: outgoing ORM objects are converted to clean JSON for the client.

Naming convention: `XxxCreate` / `XxxUpdate` are inputs, `XxxOut` is an output,
`XxxList` is a paginated output.
"""
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator

from .validation import CREATABLE_TYPES, ValidationError, validate_record


# --- Auth ---
class LoginRequest(BaseModel):
    username: str
    password: str


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    username: str


class LoginResponse(BaseModel):
    token: str
    user: UserOut


# --- Hosted Zones ---
class ZoneCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=253)
    type: str = Field(default="Public")
    comment: str = Field(default="")

    @field_validator("name")
    @classmethod
    def normalize_name(cls, v: str) -> str:
        # Normalize "Example.COM" or "example.com" -> "example.com." (trailing dot).
        v = v.strip().lower().rstrip(".")
        if not v:
            raise ValueError("Domain name is required")
        return v + "."

    @field_validator("type")
    @classmethod
    def check_type(cls, v: str) -> str:
        if v not in ("Public", "Private"):
            raise ValueError("type must be 'Public' or 'Private'")
        return v


class ZoneUpdate(BaseModel):
    comment: Optional[str] = None


class ZoneOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    name: str
    type: str
    comment: str
    record_count: int
    created_at: datetime


class ZoneList(BaseModel):
    items: List[ZoneOut]
    total: int
    page: int
    page_size: int


# --- DNS Records ---
class RecordBase(BaseModel):
    name: str = Field(..., min_length=1)
    type: str
    value: str = Field(..., min_length=1)
    ttl: int = Field(default=300, ge=0, le=2147483647)
    routing_policy: str = Field(default="Simple")

    @field_validator("type")
    @classmethod
    def check_type(cls, v: str) -> str:
        v = v.upper()
        if v not in CREATABLE_TYPES:
            raise ValueError(f"type must be one of {', '.join(CREATABLE_TYPES)}")
        return v

    def run_value_validation(self) -> None:
        """Apply the per-type DNS value rules from validation.py.

        Called by the route after the model is built (the record type and value
        are both needed together, so this is a method rather than a field rule).
        """
        try:
            validate_record(self.type, self.value)
        except ValidationError as e:
            raise ValueError(str(e))


class RecordCreate(RecordBase):
    pass


class RecordUpdate(BaseModel):
    name: Optional[str] = None
    value: Optional[str] = None
    ttl: Optional[int] = Field(default=None, ge=0, le=2147483647)
    routing_policy: Optional[str] = None


class RecordOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    zone_id: str
    name: str
    type: str
    value: str
    ttl: int
    routing_policy: str
    created_at: datetime


class RecordList(BaseModel):
    items: List[RecordOut]
    total: int
    page: int
    page_size: int


# --- Bulk operations (bonus, used in Step 16) ---
class BulkDeleteRequest(BaseModel):
    ids: List[int]


class BulkCreateRequest(BaseModel):
    records: List[RecordCreate]


class BulkResult(BaseModel):
    created: int = 0
    deleted: int = 0
    errors: List[str] = []
