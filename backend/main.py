import os

from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import create_db_and_tables
from routers import (
    allocations,
    booking,
    campuses,
    dashboard,
    fees,
    payments,
    periods,
    rooms,
    students,
)

load_dotenv()

DEBUG = os.getenv("DEBUG", "false").lower() in ("1", "true", "yes")
CORS_ORIGINS = [
    origin.strip()
    for origin in os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
    if origin.strip()
]


@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()
    yield


app = FastAPI(
    title="Dormir API",
    version="1.0.0",
    lifespan=lifespan,
    debug=DEBUG,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(campuses.router, prefix="/campuses", tags=["campuses"])
app.include_router(rooms.router, prefix="/rooms", tags=["rooms"])
app.include_router(students.router, prefix="/students", tags=["students"])
app.include_router(booking.router, prefix="/bookings", tags=["bookings"])
app.include_router(allocations.router, prefix="/allocations", tags=["allocations"])
app.include_router(fees.router, prefix="/fees", tags=["fees"])
app.include_router(payments.router, prefix="/payments", tags=["payments"])
app.include_router(periods.router, prefix="/periods", tags=["periods"])
app.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])


@app.get("/")
async def root():
    return {
        "name": "Dormir API",
        "version": "1.0.0",
        "status": "running",
    }


@app.get("/health")
async def health():
    return {"status": "ok"}
