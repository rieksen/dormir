"""
seed_students.py — Import the 66 current residents from the Google Sheet.

Each entry maps:
  room_number  → must match the R-prefixed room_number in ROOM_SEED_DATA
  bed_slot     → 1 or 2 (which bed within the room)
  full_name
  gender       → inferred from room occupants / name (best-effort)
  status       → "active" | "cleared" | "pending"
               "cleared" means all payments confirmed
               "pending" means room booked but payment record minimal
  amount_paid  → total UGX paid so far (booking + balances that are cleared)
  amount_due   → total rent for the semester (room price_per_bed)

Run: python seed_students.py
Idempotent: skips students whose full_name is already in an active booking for
that room, so safe to re-run.
"""

from datetime import datetime, timezone

from sqlmodel import Session, select

from database import create_db_and_tables, engine
from models_booking import Booking, BookingStatus
from models_payment import Payment, PaymentStatus
from models_room import Bed, Room, RoomGender
from models_student import Gender, Semester, Student
from services_hostel import (
    gender_to_room_gender,
    seed_rooms_and_beds,
)

# ---------------------------------------------------------------------------
# Spreadsheet data
# Each tuple:
#   (room_number, bed_slot, full_name, gender, status, amount_paid)
#
# room_number uses the R-prefix convention from ROOM_SEED_DATA.
# bed_slot is 1-based index within the room.
# gender inferred from context (mixed rooms default to spreadsheet ordering).
# status: "cleared" → payment confirmed; "active" → payment pending;
#          "pending" → registered but no total on sheet yet
# amount_paid is the sum of non-"Balance" payments actually received (confirmed).
# ---------------------------------------------------------------------------

STUDENTS = [
    # Room 1 — DOUBLE (2 beds), 650 000/bed
    ("R01", 1, "Nugaba Ritah",          "Female", "cleared", 600_000),
    ("R01", 2, "Nuwaheraza Maclean",    "Female", "cleared", 600_000),

    # Room 2 — SINGLE
    ("R02", 1, "Akankunda Shanita",     "Female", "active",  450_000),

    # Room 3 — SINGLE
    ("R03", 1, "Kyokusaba Christine",   "Female", "active",  1_200_000),

    # Room 4 — DOUBLE (treated as 2 beds on sheet)
    ("R04", 1, "Mugisha Debbie",        "Female", "active",  350_000),
    ("R04", 2, "Aiko Owen Blair",       "Male",   "active",  1_210_000),

    # Room 5 — SINGLE
    ("R05", 1, "Martha Amuge",          "Female", "active",  750_000),

    # Room 6 — DOUBLE
    ("R06", 1, "Kabandize Karen",       "Female", "active",  550_000),
    ("R06", 2, "Mwasigye Eliah",        "Male",   "cleared", 650_000),

    # Room 7A — SINGLE (2 beds on sheet, treat as 1 student here)
    ("R7A", 1, "Evelyn Irakutu",        "Female", "active",  1_150_000),

    # Room 7B — SINGLE
    ("R7B", 1, "Javis Byamhyo",         "Male",   "cleared", 800_000),

    # Room 8 — SINGLE
    ("R08", 1, "Ahereza Bridget",       "Female", "cleared", 700_000),

    # Room 9 — SINGLE
    ("R09", 1, "Akunh Edinah",          "Female", "cleared", 700_000),

    # Room 10 — SINGLE
    ("R10", 1, "Isuka Deborah",         "Female", "cleared", 810_000),

    # Room 11 — SINGLE
    ("R11", 1, "Mutabaazi Iga",         "Male",   "active",  500_000),

    # Room 12 — SINGLE
    ("R12", 1, "Nuwahureza Atuhairye Nimrod", "Male", "cleared", 800_000),

    # Room 13 — SINGLE
    ("R13", 1, "Mugicha Moses",         "Male",   "active",  550_000),

    # Room 14 — DOUBLE
    ("R14", 1, "Okioro Christine",      "Female", "active",  650_000),
    ("R14", 2, "Bwambale Jonah",        "Male",   "active",  500_000),

    # Room 15 — DOUBLE
    ("R15", 1, "Tut Palet",             "Male",   "active",  700_000),
    ("R15", 2, "Taban Michael",         "Male",   "active",  780_000),

    # Room 16 — SINGLE
    ("R16", 1, "Kamala Mikam",          "Male",   "active",  400_000),

    # Room 17 — SINGLE
    ("R17", 1, "Adorah Nantongo",       "Female", "active",  670_000),

    # Room 18 — DOUBLE
    ("R18", 1, "Naluti Solomon",        "Male",   "active",  400_000),
    ("R18", 2, "Slondamu Alvin",        "Male",   "cleared", 700_000),

    # Room 19A — SINGLE (Pending — no confirmed total)
    ("R19A", 1, "Mumbere Elijah",       "Male",   "pending", 400_000),

    # Room 19B — SINGLE (Pending)
    ("R19B", 1, "Chloe Choe",           "Female", "pending", 750_000),

    # Room 20 — DOUBLE (sheet says room 29 for room number, actual room is 20)
    ("R20", 1, "Ayesiga Marry",         "Female", "active",  650_000),
    ("R20", 2, "Aswingira Christine",   "Female", "active",  650_000),

    # Room 21 — DOUBLE
    ("R21", 1, "Mutebi Andrew",         "Male",   "active",  400_000),
    ("R21", 2, "Nuwagira Brian",        "Male",   "active",  650_000),

    # Room 22 — SINGLE
    ("R22", 1, "Shephzion Esther",      "Female", "cleared", 750_000),

    # Room 23 — SINGLE
    ("R23", 1, "Muliganirwe Jullian",   "Male",   "active",  750_000),

    # Room 24 — SINGLE
    ("R24", 1, "Okiria Tonny",          "Male",   "active",  550_000),

    # Room 25 — SINGLE
    ("R25", 1, "Bakke Edward",          "Male",   "active",  600_000),

    # Room 26 — SINGLE
    ("R26", 1, "Omara Gabriel",         "Male",   "cleared", 800_000),

    # Room 27 — SINGLE
    ("R27", 1, "Iwinanasiko Bryton",    "Male",   "active",  830_000),

    # Room 28 — SINGLE
    ("R28", 1, "Akedwijuka Francis",    "Male",   "active",  700_000),

    # Room 29 — SINGLE
    ("R29", 1, "Ngabirano Onorius",     "Male",   "cleared", 800_000),

    # Room 30 — SINGLE
    ("R30", 1, "Kasbal Ignecious",      "Male",   "cleared", 800_000),

    # Room 31 — SINGLE
    ("R31", 1, "Musingunzi Derick",     "Male",   "cleared", 700_000),

    # Room 32 — DOUBLE
    ("R32", 1, "Naatigaba Lucky",       "Female", "cleared", 700_000),
    ("R32", 2, "Kaggwa Garvin",         "Male",   "active",  700_000),

    # Room 33 — DOUBLE
    ("R33", 1, "Amanyire Faith",        "Female", "active",  700_000),
    ("R33", 2, "Amoit Patricia",        "Female", "active",  500_000),

    # Room 34 — DOUBLE
    ("R34", 1, "Mulungi Kenwill",       "Male",   "cleared", 700_000),
    ("R34", 2, "Akatejeka Emmanuel",    "Male",   "active",  610_000),

    # Room 35 — DOUBLE
    ("R35", 1, "Autasiigwa David",      "Male",   "cleared", 700_000),
    ("R35", 2, "William Gasiani",       "Male",   "active",  650_000),

    # Room 36 — TRIPLE (3 beds)
    ("R36", 1, "Mukama Shebs",          "Male",   "active",  400_000),
    ("R36", 2, "Kakama Patricia",       "Female", "cleared", 500_000),
    ("R36", 3, "Ahurire Nancy",         "Female", "active",  400_000),

    # Room 37 — DOUBLE
    ("R37", 1, "Godwill Natasha",       "Female", "active",  350_000),
    ("R37", 2, "Ndagire Peninah",       "Female", "cleared", 700_000),

    # Room 38 — DOUBLE
    ("R38", 1, "Taremwa Elijah",        "Male",   "active",  500_000),
    ("R38", 2, "Abdul Ahmed",           "Male",   "active",  700_000),

    # Room 39 — SINGLE
    ("R39", 1, "Kekuru Joshua",         "Male",   "active",  750_000),

    # Room 40 — SINGLE
    ("R40", 1, "Asaph Atuko",           "Male",   "cleared", 900_000),

    # Room 41 — SINGLE
    ("R41", 1, "Akai Zeporiah",         "Female", "active",  150_000),

    # Room 42 — SINGLE
    ("R42", 1, "Katumba Ronald",        "Male",   "cleared", 980_000),

    # Room 43 — DOUBLE
    ("R43", 1, "Kamugasha Derick",      "Male",   "cleared", 700_000),
    ("R43", 2, "Mubiru Adrian",         "Male",   "active",  500_000),

    # Room 44 — SINGLE
    ("R44", 1, "Amanya Collins",        "Male",   "active",  700_000),

    # Room 45 — SINGLE
    ("R45", 1, "Acam Patience",         "Female", "cleared", 700_000),

    # Room 46 — SINGLE
    ("R46", 1, "Othen Zerulamba",       "Male",   "active",  550_000),

    # Room 47 — SINGLE
    ("R47", 1, "Steward Akiriza",       "Male",   "cleared", 950_000),

    # Room 48 — SINGLE
    ("R48", 1, "Kojomuhenda Denise",    "Female", "active",  800_000),

    # Room 49 — SINGLE
    ("R49", 1, "Ankunda Ruth",          "Female", "cleared", 850_000),

    # Room 50 — SINGLE
    ("R50", 1, "Comfort Natulinda",     "Female", "active",  950_000),

    # Room 51 — SINGLE
    ("R51", 1, "Kriza Dennie",          "Female", "cleared", 800_000),

    # Room 52 — SINGLE
    ("R52", 1, "Ojoko Trevor",          "Male",   "active",  700_000),

    # Room 53 — SINGLE
    ("R53", 1, "Kyemulai Jabelb",       "Male",   "active",  750_000),

    # Room 54 — SINGLE
    ("R54", 1, "Sharif Chebel",         "Male",   "active",  750_000),

    # Room 55 — SINGLE
    ("R55", 1, "Esther",                "Female", "active",  450_000),

    # Room 56 — SINGLE
    ("R56", 1, "Olka Joshua",           "Male",   "cleared", 1_100_000),

    # Room 57 — SINGLE
    ("R57", 1, "Lubanga Francis",       "Male",   "active",  450_000),

    # Room 58 — SINGLE
    ("R58", 1, "Acom Ruth",             "Female", "active",  400_000),

    # Room 59 — SINGLE
    ("R59", 1, "Iga Robert",            "Male",   "active",  300_000),

    # Room 60 — SINGLE
    ("R60", 1, "Nanyazi Hiba",          "Female", "cleared", 750_000),

    # Room 61 — SINGLE
    ("R61", 1, "Otim Nicholas",         "Male",   "cleared", 750_000),

    # Room 62 — SINGLE
    ("R62", 1, "Byashayah Tommy",       "Male",   "active",  160_000),

    # Room 63 — SINGLE
    ("R63", 1, "Nabasa Bridget",        "Female", "active",  450_000),

    # Room 64 — SINGLE
    ("R64", 1, "Okango Noel",           "Male",   "active",  100_000),

    # Room 65 — SINGLE
    ("R65", 1, "Okondan Derick",        "Male",   "cleared", 800_000),

    # Room 66 — SINGLE
    ("R66", 1, "Ankunda Keith",         "Male",   "active",  550_000),
]


def main() -> None:
    create_db_and_tables()

    with Session(engine) as session:
        # Ensure rooms/beds exist first
        seed_rooms_and_beds(session)

        semester = Semester.sem1
        year = 2026

        created = 0
        skipped = 0
        errors = []

        for room_number, bed_slot, full_name, gender_str, status, amount_paid in STUDENTS:
            # Find room
            room = session.exec(select(Room).where(Room.room_number == room_number)).first()
            if not room:
                errors.append(f"Room {room_number} not found — skipping {full_name}")
                continue

            # Find specific bed
            bed = session.exec(
                select(Bed)
                .where(Bed.room_id == room.id)
                .where(Bed.bed_number == bed_slot)
            ).first()
            if not bed:
                errors.append(f"Bed {bed_slot} in {room_number} not found — skipping {full_name}")
                continue

            # Idempotency: skip if an active booking already exists for this bed
            existing_booking = session.exec(
                select(Booking)
                .where(Booking.bed_id == bed.id)
                .where(Booking.status == BookingStatus.active)
            ).first()
            if existing_booking:
                # Check if it's the same student
                existing_student = session.get(Student, existing_booking.student_id)
                if existing_student and existing_student.full_name == full_name:
                    skipped += 1
                    continue
                else:
                    errors.append(
                        f"Bed {bed_slot} in {room_number} is already occupied by "
                        f"{existing_student.full_name if existing_student else '?'} "
                        f"— cannot seat {full_name}"
                    )
                    continue

            # Also check if a student with this name already has an active booking
            existing_name_booking = session.exec(
                select(Booking, Student)
                .join(Student, Booking.student_id == Student.id)
                .where(Student.full_name == full_name)
                .where(Booking.status == BookingStatus.active)
            ).first()
            if existing_name_booking:
                skipped += 1
                continue

            gender = Gender.male if gender_str == "Male" else Gender.female

            # Create student with placeholder details
            student = Student(
                full_name=full_name,
                phone="+256 700 000000",
                emergency_contact="+256 700 000000",
                university="Unknown",
                course="Unknown",
                year_of_study=1,
                course_duration=4,
                gender=gender,
                semester_joined=Semester.sem1,
                year_joined=2025,
            )
            session.add(student)
            session.flush()

            # Create booking
            booking = Booking(
                student_id=student.id,
                bed_id=bed.id,
                semester=semester,
                year=year,
                status=BookingStatus.active,
            )
            session.add(booking)
            session.flush()

            # Mark bed occupied and set room gender
            bed.is_occupied = True
            room_gender = gender_to_room_gender(gender)
            if room.gender == RoomGender.unassigned:
                room.gender = room_gender
            session.add(bed)
            session.add(room)
            session.flush()

            # Create payment record
            pay_status = PaymentStatus.confirmed if status == "cleared" else PaymentStatus.pending
            confirmed_at = datetime.now(timezone.utc) if status == "cleared" else None

            payment = Payment(
                booking_id=booking.id,
                amount=amount_paid,
                status=pay_status,
                confirmed_at=confirmed_at,
            )
            session.add(payment)

            created += 1

        session.commit()

    print(f"\n✓ Seed complete: {created} students created, {skipped} already exist.")
    if errors:
        print(f"\n⚠ {len(errors)} issues:")
        for e in errors:
            print(f"  • {e}")


if __name__ == "__main__":
    main()