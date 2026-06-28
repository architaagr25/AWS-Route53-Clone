"""Hosted Zone CRUD, search, pagination, and cascade delete."""


def test_create_zone_normalizes_name_and_seeds_soa_ns(client, auth):
    res = client.post(
        "/api/zones", headers=auth, json={"name": "Example.COM", "comment": "hi"}
    )
    assert res.status_code == 201
    body = res.json()
    assert body["name"] == "example.com."  # lowercased + trailing dot
    assert body["id"].startswith("Z")
    assert body["record_count"] == 2  # auto SOA + NS


def test_duplicate_zone_conflict(client, auth, zone):
    res = client.post("/api/zones", headers=auth, json={"name": "example.com"})
    assert res.status_code == 409


def test_list_search_and_pagination(client, auth):
    for name in ["alpha.com", "beta.com", "gamma.net"]:
        client.post("/api/zones", headers=auth, json={"name": name})

    # search matches by name
    res = client.get("/api/zones?search=beta", headers=auth).json()
    assert res["total"] == 1
    assert res["items"][0]["name"] == "beta.com."

    # pagination caps the page size
    page = client.get("/api/zones?page=1&page_size=2", headers=auth).json()
    assert page["total"] == 3
    assert len(page["items"]) == 2


def test_get_update_delete(client, auth, zone):
    zid = zone["id"]
    assert client.get(f"/api/zones/{zid}", headers=auth).status_code == 200

    upd = client.put(f"/api/zones/{zid}", headers=auth, json={"comment": "edited"})
    assert upd.json()["comment"] == "edited"

    assert client.delete(f"/api/zones/{zid}", headers=auth).status_code == 204
    assert client.get(f"/api/zones/{zid}", headers=auth).status_code == 404


def test_delete_cascades_records(client, auth, zone):
    zid = zone["id"]
    client.post(
        f"/api/zones/{zid}/records",
        headers=auth,
        json={"name": "www", "type": "A", "value": "1.2.3.4"},
    )
    client.delete(f"/api/zones/{zid}", headers=auth)
    # records endpoint for a missing zone returns 404 (zone and its records are gone)
    assert client.get(f"/api/zones/{zid}/records", headers=auth).status_code == 404


def test_missing_zone_404(client, auth):
    assert client.get("/api/zones/ZNOPE", headers=auth).status_code == 404
