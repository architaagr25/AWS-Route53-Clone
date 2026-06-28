"""Auth routes: login, logout, and current-user (session persistence).

- POST /api/auth/login   -> validate credentials, return a session token + user
- POST /api/auth/logout  -> no-op server-side (token is discarded by the client)
- GET  /api/auth/me      -> return the logged-in user; used to restore a session
                            when the frontend reloads with a saved token
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..auth import create_token, get_current_user
from ..database import get_db
from ..models import User
from ..schemas import LoginRequest, LoginResponse, UserOut

# An APIRouter groups related endpoints under a common prefix and tag.
router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login", response_model=LoginResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    """Check username/password against the users table; issue a token on success."""
    user = db.query(User).filter(User.username == payload.username.strip()).first()
    if not user or user.password != payload.password:
        # Same error for "no such user" and "wrong password" — never reveal which.
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )
    token = create_token(user.username)
    return LoginResponse(token=token, user=UserOut.model_validate(user))


@router.post("/logout")
def logout(_: User = Depends(get_current_user)):
    """Stateless logout: the client simply forgets the token. We just confirm."""
    return {"detail": "Logged out"}


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)):
    """Return the current user. The frontend calls this on load to restore session."""
    return UserOut.model_validate(user)
