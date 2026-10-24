from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.database.connection import connect_db, close_db
from app.routers import auth, academic, materials, assignments, exams, analytics


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await connect_db()
    # Ensure upload directory exists
    Path(settings.upload_dir).mkdir(parents=True, exist_ok=True)
    yield
    # Shutdown
    await close_db()


app = FastAPI(
    title="IT LearnHub API",
    description="Backend for the IT LearnHub student learning and exam preparation portal.",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — only allow configured frontend origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth.router)
app.include_router(academic.router)
app.include_router(materials.router)
app.include_router(assignments.router)
app.include_router(exams.router)
app.include_router(analytics.router)


@app.get("/", tags=["Root"])
async def root():
    return {"message": "IT LearnHub API is running", "docs": "/docs", "health": "/health"}


@app.get("/health", tags=["Health"])
async def health():
    return {"status": "ok", "service": "IT LearnHub API"}
