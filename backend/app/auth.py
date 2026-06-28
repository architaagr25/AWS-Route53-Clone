"""Mocked auth: stateless, signed session tokens backed by the users table.

Tokens are signed with a static secret and carry no server-side session state,
so they keep working across restarts — the frontend stores the token and the
backend re-verifies it by signature alone. Not real security, just a demo.
"""
import base64
import hashlib
import hmac

from fastapi import Depends, Header, HTTPException, status
from sqlalchemy.orm import Session

from .database import get_db
from .models import User

# Static demo secret. Fine for a mocked system; a real app keeps this in an env var.
_SECRET = b"route53-clone-demo-secret"


def _sign(username: str) -> str:
    """Compute a short HMAC signature binding a token to our secret."""
    return hmac.new(_SECRET, username.encode(), hashlib.sha256).hexdigest()[:32]


def create_token(username: str) -> str:
    """Build a token of the form '<base64(username)>.<signature>'."""
    payload = base64.urlsafe_b64encode(username.encode()).decode().rstrip("=")
    return f"{payload}.{_sign(username)}"


def verify_token(token: str) -> str | None:
    """Return the username if the token is authentic, else None.

    We decode the username from the payload, recompute the signature, and compare
    using hmac.compare_digest (constant-time, avoids timing leaks). If the token
    was tampered with, the signatures will not match.
    """
    try:
        payload, sig = token.split(".", 1)
        padding = "=" * (-len(payload) % 4)
        username = base64.urlsafe_b64decode(payload + padding).decode()
    except (ValueError, UnicodeDecodeError):
        return None
    if hmac.compare_digest(sig, _sign(username)):
        return username
    return None


def get_current_user(
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db),
) -> User:
    """FastAPI dependency that protects a route.

    Reads the 'Authorization: Bearer <token>' header, verifies the token, loads
    the user, and returns it. Any failure raises 401 Unauthorized, so protected
    endpoints simply declare `user: User = Depends(get_current_user)` and can
    assume a valid, logged-in user.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )
    token = authorization.split(" ", 1)[1]
    username = verify_token(token)
    if not username:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired session",
        )
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User no longer exists",
        )
    return user
