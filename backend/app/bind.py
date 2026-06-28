"""BIND zone-file parsing (bonus: import).

Supports the common subset of BIND master-file syntax: the $TTL and $ORIGIN
directives, blank-owner continuation ("reuse the previous name"), an optional
per-record TTL, the optional IN class, and the record types this app supports.
It is forgiving — unparseable lines are reported as errors rather than aborting.
"""
import json
from datetime import datetime, timezone
from typing import List, Tuple

from .models import DnsRecord, HostedZone
from .validation import CREATABLE_TYPES

_RECORD_TYPES = set(CREATABLE_TYPES) | {"SOA"}


def parse_bind_zone(content: str, zone_name: str) -> Tuple[List[dict], List[str]]:
    """Parse BIND text into (records, errors).

    Each record is a dict ready to build a DnsRecord: name, type, value, ttl,
    routing_policy. `errors` collects human-readable messages for skipped lines.
    """
    records: List[dict] = []
    errors: List[str] = []
    origin = zone_name if zone_name.endswith(".") else zone_name + "."
    default_ttl = 300
    last_name = origin

    for lineno, raw in enumerate(content.splitlines(), start=1):
        line = raw.split(";", 1)[0].rstrip()  # strip comments
        if not line.strip():
            continue

        # Directives
        if line.startswith("$TTL"):
            parts = line.split()
            if len(parts) >= 2 and parts[1].isdigit():
                default_ttl = int(parts[1])
            else:
                errors.append(f"line {lineno}: invalid $TTL")
            continue
        if line.startswith("$ORIGIN"):
            parts = line.split()
            if len(parts) >= 2:
                origin = parts[1] if parts[1].endswith(".") else parts[1] + "."
            continue

        starts_blank = raw[:1] in (" ", "\t")
        tokens = line.split()
        if not tokens:
            continue

        idx = 0
        if starts_blank:
            name = last_name  # continuation: reuse previous owner name
        else:
            owner = tokens[idx]
            idx += 1
            if owner == "@":
                name = origin
            elif owner.endswith("."):
                name = owner
            else:
                name = f"{owner}.{origin}"
        last_name = name

        # Optional TTL
        ttl = default_ttl
        if idx < len(tokens) and tokens[idx].isdigit():
            ttl = int(tokens[idx])
            idx += 1
        # Optional class
        if idx < len(tokens) and tokens[idx].upper() in ("IN", "CH", "HS"):
            idx += 1
        # Type
        if idx >= len(tokens):
            errors.append(f"line {lineno}: missing record type")
            continue
        rtype = tokens[idx].upper()
        idx += 1
        if rtype not in _RECORD_TYPES:
            errors.append(f"line {lineno}: unsupported type '{rtype}'")
            continue
        # Value (the rest of the line)
        value = " ".join(tokens[idx:]).strip().strip('"')
        if not value:
            errors.append(f"line {lineno}: missing record value")
            continue

        records.append(
            {
                "name": name.lower(),
                "type": rtype,
                "value": value,
                "ttl": ttl,
                "routing_policy": "Simple",
            }
        )

    return records, errors


def records_to_bind(zone: HostedZone, records: List[DnsRecord]) -> str:
    """Serialize a zone + its records into BIND master-file text."""
    lines = [
        f"; BIND zone file for {zone.name}",
        "; Exported from Route 53 Clone",
        f"$ORIGIN {zone.name}",
        "$TTL 300",
        "",
    ]
    # Conventional ordering: SOA first, then NS, then everything else by name.
    order = {"SOA": 0, "NS": 1}
    for r in sorted(records, key=lambda x: (order.get(x.type, 2), x.name)):
        for val in r.value.splitlines():
            val = val.strip()
            if not val:
                continue
            out = f'"{val}"' if r.type == "TXT" else val
            lines.append(f"{r.name}\t{r.ttl}\tIN\t{r.type}\t{out}")
    lines.append("")
    return "\n".join(lines)


def zone_to_json(zone: HostedZone, records: List[DnsRecord]) -> str:
    """Serialize a zone + its records into an indented JSON document."""
    doc = {
        "hostedZone": {
            "id": zone.id,
            "name": zone.name,
            "type": zone.type,
            "comment": zone.comment,
            "recordCount": zone.record_count,
        },
        "records": [
            {
                "name": r.name,
                "type": r.type,
                "ttl": r.ttl,
                "value": r.value.splitlines(),
                "routingPolicy": r.routing_policy,
            }
            for r in records
        ],
        "exportedAt": datetime.now(timezone.utc).isoformat(),
    }
    return json.dumps(doc, indent=2)
