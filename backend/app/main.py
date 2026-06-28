"""FastAPI app entrypoint: CORS, table creation + seeding on startup, routers."""
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# import models so their tables register on Base before create_all()
from . import models  # noqa: F401  (imported for its side effect)
from .database import Base, SessionLocal, engine
from .routers import auth, records, zones
from .seed import seed


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Run once when the server starts: create tables and seed baseline data."""
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed(db)
    finally:
        db.close()
    yield


app = FastAPI(
    title="Route 53 Clone API",
    description="A mocked AWS Route 53 backend: hosted zones and DNS records.",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — allow the Next.js dev server (and a deployed frontend) to call this API
# from the browser. Without this, browsers block cross-origin requests.
_origins = os.environ.get(
    "FRONTEND_ORIGINS",
    "http://localhost:3000,http://127.0.0.1:3000",
).split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in _origins if o.strip()],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Mount the auth, zones, and records API routers.
app.include_router(auth.router)
app.include_router(zones.router)
app.include_router(records.router)


@app.get("/api/health", tags=["health"])
def health():
    """Simple liveness probe used to confirm the API is running."""
    return {"status": "ok"}
