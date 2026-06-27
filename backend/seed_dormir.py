"""Seed fixed hostel rooms and beds.

Startup already calls this inventory seeder through create_db_and_tables(). Run this
script manually when you want to ensure the fixed room/bed inventory exists.
"""

from sqlmodel import Session, select

from database import create_db_and_tables, engine
from models_room import Bed, Room
from services_hostel import seed_rooms_and_beds


def main() -> None:
    create_db_and_tables()
    with Session(engine) as session:
        seed_rooms_and_beds(session)
        rooms = len(session.exec(select(Room)).all())
        beds = len(session.exec(select(Bed)).all())
    print(f"Seeded hostel inventory: {rooms} rooms, {beds} beds.")


if __name__ == "__main__":
    main()
