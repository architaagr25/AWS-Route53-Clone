"""Per-record-type value validation for DNS records.

DNS record types each have their own value format: an A record holds an IPv4
address, an MX record holds a priority plus a hostname, and so on. This module
checks that a record's value actually matches its type before we save it.

The strictness is pragmatic: strict for common types whose values are visible in
the UI (A, AAAA, CNAME, MX), lenient for free-form types (TXT) so the demo never
blocks legitimate input.
"""
import ipaddress
import re

# Every record type the app understands (the 9 required types + system SOA).
RECORD_TYPES = ["A", "AAAA", "CNAME", "TXT", "MX", "NS", "PTR", "SRV", "CAA", "SOA"]

# Types a user can create from the UI. SOA is created/managed by the system only.
CREATABLE_TYPES = ["A", "AAAA", "CNAME", "TXT", "MX", "NS", "PTR", "SRV", "CAA"]

# A practical hostname matcher (labels separated by dots, optional trailing dot).
_HOSTNAME_RE = re.compile(
    r"^(?=.{1,253}\.?$)"
    r"([a-zA-Z0-9_](?:[a-zA-Z0-9_-]{0,61}[a-zA-Z0-9])?\.)+"
    r"[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]\.?$"
)


class ValidationError(Exception):
    """Raised when a record value is invalid for its type."""


def _check_ipv4(line: str) -> None:
    try:
        ipaddress.IPv4Address(line)
    except ValueError:
        raise ValidationError(f"'{line}' is not a valid IPv4 address")


def _check_ipv6(line: str) -> None:
    try:
        ipaddress.IPv6Address(line)
    except ValueError:
        raise ValidationError(f"'{line}' is not a valid IPv6 address")


def _check_hostname(line: str) -> None:
    if not _HOSTNAME_RE.match(line):
        raise ValidationError(f"'{line}' is not a valid hostname")


def validate_record(rtype: str, value: str) -> None:
    """Validate a record's value against its type.

    `value` may contain multiple entries separated by newlines (e.g. an NS
    record with several nameservers). Raises ValidationError with a clear
    message on the first problem; returns None if everything is valid.
    """
    rtype = rtype.upper()
    if rtype not in RECORD_TYPES:
        raise ValidationError(f"Unsupported record type '{rtype}'")

    lines = [ln.strip() for ln in value.splitlines() if ln.strip()]
    if not lines:
        raise ValidationError("Record value cannot be empty")

    for line in lines:
        if rtype == "A":
            _check_ipv4(line)
        elif rtype == "AAAA":
            _check_ipv6(line)
        elif rtype == "CNAME":
            if len(lines) > 1:
                raise ValidationError("CNAME records must have exactly one value")
            _check_hostname(line)
        elif rtype in ("NS", "PTR"):
            _check_hostname(line)
        elif rtype == "MX":
            # Format: "<priority> <hostname>"  e.g. "10 mail.example.com."
            parts = line.split()
            if len(parts) != 2 or not parts[0].isdigit():
                raise ValidationError(
                    f"MX value '{line}' must be '<priority> <hostname>'"
                )
            _check_hostname(parts[1])
        elif rtype == "SRV":
            # Format: "<priority> <weight> <port> <target>"
            parts = line.split()
            if len(parts) != 4 or not all(p.isdigit() for p in parts[:3]):
                raise ValidationError(
                    f"SRV value '{line}' must be '<priority> <weight> <port> <target>'"
                )
        elif rtype == "CAA":
            # Format: "<flags> <tag> <value>"  e.g. '0 issue "letsencrypt.org"'
            parts = line.split(maxsplit=2)
            if len(parts) != 3 or not parts[0].isdigit():
                raise ValidationError(
                    f"CAA value '{line}' must be '<flags> <tag> \"<value>\"'"
                )
        # TXT and SOA accept any non-empty text — no structural rule.
