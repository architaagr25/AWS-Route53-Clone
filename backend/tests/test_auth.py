"""Auth: login, session, and route protection."""


def test_health(client):
    assert client.get("/api/health").json() == {"status": "ok"}


def test_login_success(client):
    res = client.post(
        "/api/auth/login", json={"username": "admin", "password": "admin"}
    )
    assert res.status_code == 200
    body = res.json()
    assert body["token"]
    assert body["user"]["username"] == "admin"


def test_login_wrong_password(client):
    res = client.post(
        "/api/auth/login", json={"username": "admin", "password": "nope"}
    )
    assert res.status_code == 401


def test_me_requires_token(client):
    assert client.get("/api/auth/me").status_code == 401


def test_me_with_token(client, auth):
    res = client.get("/api/auth/me", headers=auth)
    assert res.status_code == 200
    assert res.json()["username"] == "admin"


def test_protected_route_without_token(client):
    # Zones can't be listed without authenticating.
    assert client.get("/api/zones").status_code == 401
