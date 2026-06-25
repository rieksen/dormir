from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from .routers import leases, units, tenants, payments, maintenance, dashboard
from .database import create_db_and_tables 


@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()
    yield


app = FastAPI(title="APTv16 API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten in production
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(units.router, prefix="/units", tags=["units"])
app.include_router(tenants.router, prefix="/tenants", tags=["tenants"])
app.include_router(payments.router, prefix="/payments", tags=["payments"])
app.include_router(leases.router, prefix="/leases", tags=["leases"])
app.include_router(maintenance.router, prefix="/maintenance", tags=["maintenance"])
app.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])



@app.get("/health")
async def health():
    return {"status": "ok"}
