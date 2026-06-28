"""BIND import (preview + commit) and JSON/BIND export."""

ZONE_FILE = """\
$ORIGIN example.com.
$TTL 300
www      IN  A     192.0.2.1
@    3600 IN  MX    10 mail.example.com.
oops     IN  A     not-an-ip
@        IN  SOA   ns1. admin. 1 2 3 4 5
"""


def test_import_preview_then_commit(client, auth, zone):
    zid = zone["id"]

    # preview: 2 valid records, the bad IP and the SOA reported as errors/skips
    preview = client.post(
        f"/api/zones/{zid}/import", headers=auth, json={"content": ZONE_FILE}
    ).json()
    assert preview["count"] == 2
    assert len(preview["errors"]) == 2

    # commit: the 2 valid records are persisted
    committed = client.post(
        f"/api/zones/{zid}/import?commit=true", headers=auth, json={"content": ZONE_FILE}
    ).json()
    assert committed["imported"] == 2


def test_export_json(client, auth, zone):
    res = client.get(f"/api/zones/{zone['id']}/export?format=json", headers=auth)
    assert res.status_code == 200
    assert "attachment" in res.headers["content-disposition"]
    body = res.json()
    assert body["hostedZone"]["name"] == "example.com."


def test_export_bind(client, auth, zone):
    res = client.get(f"/api/zones/{zone['id']}/export?format=bind", headers=auth)
    assert res.status_code == 200
    assert "$ORIGIN example.com." in res.text
    assert "IN\tSOA" in res.text
