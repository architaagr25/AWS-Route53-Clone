"""DNS Record CRUD, validation, type filter, SOA protection, and bulk delete."""


def _records(client, auth, zone_id):
    return client.get(
        f"/api/zones/{zone_id}/records?page_size=100", headers=auth
    ).json()["items"]


def test_create_record_normalizes_name(client, auth, zone):
    res = client.post(
        f"/api/zones/{zone['id']}/records",
        headers=auth,
        json={"name": "www", "type": "A", "value": "1.2.3.4"},
    )
    assert res.status_code == 201
    assert res.json()["name"] == "www.example.com."


def test_apex_name(client, auth, zone):
    res = client.post(
        f"/api/zones/{zone['id']}/records",
        headers=auth,
        json={"name": "@", "type": "A", "value": "5.6.7.8"},
    )
    assert res.json()["name"] == "example.com."


def test_invalid_value_rejected(client, auth, zone):
    res = client.post(
        f"/api/zones/{zone['id']}/records",
        headers=auth,
        json={"name": "bad", "type": "A", "value": "not-an-ip"},
    )
    assert res.status_code == 422


def test_type_filter(client, auth, zone):
    zid = zone["id"]
    client.post(f"/api/zones/{zid}/records", headers=auth,
                json={"name": "www", "type": "A", "value": "1.2.3.4"})
    client.post(f"/api/zones/{zid}/records", headers=auth,
                json={"name": "blog", "type": "CNAME", "value": "www.example.com."})
    a_only = client.get(f"/api/zones/{zid}/records?type=A", headers=auth).json()
    assert all(r["type"] == "A" for r in a_only["items"])


def test_update_revalidates_value(client, auth, zone):
    rid = client.post(
        f"/api/zones/{zone['id']}/records",
        headers=auth,
        json={"name": "www", "type": "A", "value": "1.2.3.4"},
    ).json()["id"]
    ok = client.put(f"/api/records/{rid}", headers=auth, json={"value": "9.9.9.9"})
    assert ok.json()["value"] == "9.9.9.9"
    bad = client.put(f"/api/records/{rid}", headers=auth, json={"value": "nope"})
    assert bad.status_code == 422


def test_soa_cannot_be_deleted(client, auth, zone):
    soa = next(r for r in _records(client, auth, zone["id"]) if r["type"] == "SOA")
    res = client.delete(f"/api/records/{soa['id']}", headers=auth)
    assert res.status_code == 400


def test_bulk_delete_skips_soa(client, auth, zone):
    zid = zone["id"]
    ids = [
        client.post(f"/api/zones/{zid}/records", headers=auth,
                    json={"name": f"h{i}", "type": "A", "value": f"10.0.0.{i + 1}"}).json()["id"]
        for i in range(3)
    ]
    soa = next(r for r in _records(client, auth, zid) if r["type"] == "SOA")
    res = client.post(
        f"/api/zones/{zid}/records/bulk-delete",
        headers=auth,
        json={"ids": ids + [soa["id"]]},
    ).json()
    assert res["deleted"] == 3
    assert res["errors"]  # SOA reported as skipped
