"""Seed payments table."""
from .database import create_db_and_tables, engine
from .models_payment import Payment
from sqlmodel import Session

PAYMENTS = [
    {"tenant": "Zoe Mitchell",  "unit": "401", "amount": 3800, "due": "Jun 1, 2024",  "paid": "Jun 1, 2024",  "status": "Paid"},
    {"tenant": "David Kim",     "unit": "402", "amount": 2900, "due": "Jun 1, 2024",  "paid": "Jun 2, 2024",  "status": "Paid"},
    {"tenant": "Sarah Chen",    "unit": "101", "amount": 1800, "due": "Jun 1, 2024",  "paid": "Jun 1, 2024",  "status": "Paid"},
    {"tenant": "Emma Lawson",   "unit": "301", "amount": 2800, "due": "Jun 1, 2024",  "paid": None,           "status": "Pending"},
    {"tenant": "Marcus Webb",   "unit": "102", "amount": 2200, "due": "Jun 5, 2024",  "paid": None,           "status": "Pending"},
    {"tenant": "James Porter",  "unit": "302", "amount": 2000, "due": "May 1, 2024",  "paid": None,           "status": "Overdue"},
    {"tenant": "Tyler Brooks",  "unit": "202", "amount": 1900, "due": "Jun 1, 2024",  "paid": "Jun 3, 2024",  "status": "Paid"},
    {"tenant": "Priya Sharma",  "unit": "201", "amount": 2600, "due": "Jun 1, 2024",  "paid": "Jun 1, 2024",  "status": "Paid"},
]

if __name__ == "__main__":
    create_db_and_tables()
    with Session(engine) as session:
        for p in PAYMENTS:
            session.add(Payment(**p))
        session.commit()
    print(f"Seeded {len(PAYMENTS)} payments.")
