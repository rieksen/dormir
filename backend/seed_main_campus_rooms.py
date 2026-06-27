"""Seed Main Campus hostel rooms and beds.

This script populates the database with all 68 Main Campus rooms and their beds.
It is idempotent - running it multiple times will not create duplicates.

Note: The hostel has 68 rooms (not 66) because:
  - Rooms R07 and R19 are split into R7A/R7B and R19A/R19B respectively
  - Total: R01-R06, R7A, R7B, R08-R18, R19A, R19B, R20-R66 = 68 rooms

Run with:
    cd backend && source .venv/bin/activate && python seed_main_campus_rooms.py
"""

from sqlmodel import Session, select

from database import create_db_and_tables, engine
from models_room import Bed, Room
from services_hostel import seed_rooms_and_beds


def main() -> None:
    """Seed all Main Campus rooms and beds."""
    print("🏢 Seeding Main Campus Hostel rooms and beds...")
    
    # Ensure database and tables exist
    create_db_and_tables()
    
    # Seed rooms and beds
    with Session(engine) as session:
        seed_rooms_and_beds(session)
        
        # Count what we have
        rooms = session.exec(select(Room)).all()
        beds = session.exec(select(Bed)).all()
        
        # Summary by room type
        singles = sum(1 for r in rooms if len([b for b in beds if b.room_id == r.id]) == 1)
        doubles = sum(1 for r in rooms if len([b for b in beds if b.room_id == r.id]) == 2)
        
    print(f"✅ Seeding complete!")
    print(f"   📊 Total Rooms: {len(rooms)} (Singles: {singles}, Doubles: {doubles})")
    print(f"   🛏️  Total Beds: {len(beds)}")
    print(f"   💵 Price Range: 650,000 - 1,300,000 UGX")
    print(f"\n   All rooms start with gender = Unassigned")
    print(f"   All beds start as unoccupied (is_occupied = False)")


if __name__ == "__main__":
    main()
