"""Unit tests for per-record-type value validation."""
import pytest

from app.validation import ValidationError, validate_record

VALID = [
    ("A", "192.0.2.1"),
    ("AAAA", "2001:db8::1"),
    ("CNAME", "example.com."),
    ("MX", "10 mail.example.com."),
    ("SRV", "10 60 5060 sip.example.com."),
    ("TXT", "v=spf1 -all"),
    ("NS", "ns-1.example.com."),
]

INVALID = [
    ("A", "999.1.1.1"),
    ("A", "not-an-ip"),
    ("AAAA", "1.2.3.4"),
    ("CNAME", "a.com.\nb.com."),   # CNAME can't have multiple values
    ("MX", "mail.example.com."),    # missing priority
    ("SRV", "10 60 sip.example.com."),  # too few fields
]


@pytest.mark.parametrize("rtype,value", VALID)
def test_valid_values_pass(rtype, value):
    validate_record(rtype, value)  # should not raise


@pytest.mark.parametrize("rtype,value", INVALID)
def test_invalid_values_raise(rtype, value):
    with pytest.raises(ValidationError):
        validate_record(rtype, value)
