"""Seed tenants table."""
from .database import create_db_and_tables, engine
from .models_tenant import Tenant
from sqlmodel import Session

TENANTS = [
    {"name": "Sarah Chen",   "phone": "(415) 555-0101", "email": "s.chen@gmail.com",     "unit": "101", "lease_status": "Active",   "move_in": "Jan 15, 2024"},
    {"name": "Marcus Webb",  "phone": "(415) 555-0102", "email": "m.webb@gmail.com",     "unit": "102", "lease_status": "Active",   "move_in": "Mar 1, 2024"},
    {"name": "Priya Sharma", "phone": "(415) 555-0103", "email": "p.sharma@gmail.com",   "unit": "201", "lease_status": "Expiring", "move_in": "Jun 1, 2023"},
    {"name": "Tyler Brooks", "phone": "(415) 555-0104", "email": "t.brooks@gmail.com",   "unit": "202", "lease_status": "Active",   "move_in": "Sep 15, 2023"},
    {"name": "Emma Lawson",  "phone": "(415) 555-0105", "email": "e.lawson@gmail.com",   "unit": "301", "lease_status": "Active",   "move_in": "Feb 1, 2024"},
    {"name": "James Porter", "phone": "(415) 555-0106", "email": "j.porter@gmail.com",   "unit": "302", "lease_status": "Expiring", "move_in": "Aug 1, 2023"},
    {"name": "Zoe Mitchell", "phone": "(415) 555-0107", "email": "z.mitchell@gmail.com", "unit": "401", "lease_status": "Active",   "move_in": "May 1, 2024"},
    {"name": "David Kim",    "phone": "(415) 555-0108", "email": "d.kim@gmail.com",      "unit": "402", "lease_status": "Active",   "move_in": "Jan 1, 2024"},
]

if __name__ == "__main__":
    create_db_and_tables()
    with Session(engine) as session:
        for t in TENANTS:
            session.add(Tenant(**t))
        session.commit()
    print(f"Seeded {len(TENANTS)} tenants.")
