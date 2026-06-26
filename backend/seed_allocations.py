"""Seed leases table."""
from .database import create_db_and_tables, engine
from .models_lease import Lease
from sqlmodel import Session

LEASES = [
    {"tenant": "Sarah Chen",   "unit": "101", "start": "Jan 15, 2024", "end": "Jan 14, 2025", "rent": 1800, "status": "Active"},
    {"tenant": "Marcus Webb",  "unit": "102", "start": "Mar 1, 2024",  "end": "Feb 28, 2025", "rent": 2200, "status": "Active"},
    {"tenant": "Priya Sharma", "unit": "201", "start": "Jun 1, 2023",  "end": "May 31, 2024", "rent": 2600, "status": "Expiring Soon"},
    {"tenant": "Tyler Brooks", "unit": "202", "start": "Sep 15, 2023", "end": "Sep 14, 2024", "rent": 1900, "status": "Active"},
    {"tenant": "Emma Lawson",  "unit": "301", "start": "Feb 1, 2024",  "end": "Jan 31, 2025", "rent": 2800, "status": "Active"},
    {"tenant": "James Porter", "unit": "302", "start": "Aug 1, 2023",  "end": "Jul 31, 2024", "rent": 2000, "status": "Expiring Soon"},
    {"tenant": "Zoe Mitchell", "unit": "401", "start": "May 1, 2024",  "end": "Apr 30, 2025", "rent": 3800, "status": "Active"},
    {"tenant": "David Kim",    "unit": "402", "start": "Jan 1, 2024",  "end": "Dec 31, 2024", "rent": 2900, "status": "Active"},
]

if __name__ == "__main__":
    create_db_and_tables()
    with Session(engine) as session:
        for l in LEASES:
            session.add(Lease(**l))
        session.commit()
    print(f"Seeded {len(LEASES)} leases.")