"""Seed the database with initial units data."""
from .database import create_db_and_tables, engine
from .models import Unit
from sqlmodel import Session

UNITS = [
    {"number": "101", "floor": 1, "bedrooms": 1, "bathrooms": 1, "rent": 1800, "status": "Occupied",    "tenant": "Sarah Chen"},
    {"number": "102", "floor": 1, "bedrooms": 2, "bathrooms": 1, "rent": 2200, "status": "Occupied",    "tenant": "Marcus Webb"},
    {"number": "103", "floor": 1, "bedrooms": 0, "bathrooms": 1, "rent": 1400, "status": "Vacant",      "tenant": None},
    {"number": "201", "floor": 2, "bedrooms": 2, "bathrooms": 2, "rent": 2600, "status": "Occupied",    "tenant": "Priya Sharma"},
    {"number": "202", "floor": 2, "bedrooms": 1, "bathrooms": 1, "rent": 1900, "status": "Occupied",    "tenant": "Tyler Brooks"},
    {"number": "203", "floor": 2, "bedrooms": 3, "bathrooms": 2, "rent": 3200, "status": "Maintenance", "tenant": None},
    {"number": "301", "floor": 3, "bedrooms": 2, "bathrooms": 2, "rent": 2800, "status": "Occupied",    "tenant": "Emma Lawson"},
    {"number": "302", "floor": 3, "bedrooms": 1, "bathrooms": 1, "rent": 2000, "status": "Occupied",    "tenant": "James Porter"},
    {"number": "303", "floor": 3, "bedrooms": 0, "bathrooms": 1, "rent": 1500, "status": "Vacant",      "tenant": None},
    {"number": "401", "floor": 4, "bedrooms": 3, "bathrooms": 2, "rent": 3800, "status": "Occupied",    "tenant": "Zoe Mitchell"},
    {"number": "402", "floor": 4, "bedrooms": 2, "bathrooms": 2, "rent": 2900, "status": "Occupied",    "tenant": "David Kim"},
    {"number": "403", "floor": 4, "bedrooms": 1, "bathrooms": 1, "rent": 2100, "status": "Vacant",      "tenant": None},
]

if __name__ == "__main__":
    create_db_and_tables()
    with Session(engine) as session:
        for u in UNITS:
            session.add(Unit(**u))
        session.commit()
    print(f"Seeded {len(UNITS)} units.")