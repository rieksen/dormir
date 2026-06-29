from datetime import date

from fastapi import HTTPException
from sqlmodel import Session, select

from models_booking import Booking, BookingStatus
from models_room import Bed, Room, RoomGender
from models_student import Gender, Semester, Student

# Room data: (room_number, price_per_bed, num_beds)
# Singles have 1 bed, Doubles have 2 beds
ROOM_SEED_DATA = [
    ("R01", 650000, 2),  ("R02", 900000, 1),  ("R03", 800000, 1),  ("R04", 800000, 2),
    ("R05", 800000, 1),  ("R06", 800000, 2),  ("R7A", 850000, 2),  ("R7B", 650000, 1),
    ("R08", 800000, 1),  ("R09", 750000, 1),  ("R10", 900000, 1),  ("R11", 900000, 1),
    ("R12", 900000, 1),  ("R13", 1000000, 1), ("R14", 800000, 2),  ("R15", 800000, 2),
    ("R16", 700000, 1),  ("R17", 850000, 1),  ("R18", 850000, 2),  ("R19A", 1100000, 1),
    ("R19B", 850000, 1), ("R20", 800000, 2),  ("R21", 800000, 2),  ("R22", 850000, 1),
    ("R23", 850000, 1),  ("R24", 850000, 1),  ("R25", 850000, 1),  ("R26", 900000, 1),
    ("R27", 900000, 1),  ("R28", 900000, 1),  ("R29", 900000, 1),  ("R30", 800000, 1),
    ("R31", 800000, 1),  ("R32", 800000, 2),  ("R33", 800000, 2),  ("R34", 800000, 2),
    ("R35", 700000, 2),  ("R36", 750000, 3),  ("R37", 850000, 2),  ("R38", 800000, 2),
    ("R39", 800000, 1),  ("R40", 800000, 1),  ("R41", 1100000, 1), ("R42", 1100000, 1),
    ("R43", 800000, 2),  ("R44", 800000, 1),  ("R45", 800000, 1),  ("R46", 1100000, 1),
    ("R47", 1100000, 1), ("R48", 800000, 1),  ("R49", 900000, 1),  ("R50", 900000, 1),
    ("R51", 900000, 1),  ("R52", 1100000, 1), ("R53", 800000, 1),  ("R54", 900000, 1),
    ("R55", 900000, 1),  ("R56", 1300000, 1), ("R57", 1100000, 1), ("R58", 900000, 1),
    ("R59", 900000, 1),  ("R60", 900000, 1),  ("R61", 900000, 1),  ("R62", 900000, 1),
    ("R63", 900000, 1),  ("R64", 900000, 1),  ("R65", 1000000, 1), ("R66", 1000000, 1),
]

HOSTEL_ROOM_NUMBERS = tuple(room_number for room_number, _price, _beds in ROOM_SEED_DATA)


def current_semester_year(today: date | None = None) -> tuple[Semester, int]:
    today = today or date.today()
    semester = Semester.sem1 if today.month <= 6 else Semester.sem2
    return semester, today.year


def next_semester_year(semester: Semester, year: int) -> tuple[Semester, int]:
    if semester == Semester.sem1:
        return Semester.sem2, year
    return Semester.sem1, year + 1


def seed_rooms_and_beds(session: Session) -> None:
    """Seed hostel rooms/beds and reconcile inventory (idempotent)."""
    seed_map = {room_number: (price, num_beds) for room_number, price, num_beds in ROOM_SEED_DATA}
    canonical_numbers = set(seed_map)

    for room_number, (price, num_beds) in seed_map.items():
        room = session.exec(select(Room).where(Room.room_number == room_number)).first()
        if not room:
            room = Room(room_number=room_number, price_per_bed=price)
            session.add(room)
            session.flush()
        elif room.price_per_bed != price:
            room.price_per_bed = price
            session.add(room)

        for bed_number in range(1, num_beds + 1):
            bed = session.exec(
                select(Bed)
                .where(Bed.room_id == room.id)
                .where(Bed.bed_number == bed_number)
            ).first()
            if not bed:
                session.add(Bed(room_id=room.id, bed_number=bed_number))

        beds = session.exec(
            select(Bed).where(Bed.room_id == room.id).order_by(Bed.bed_number)
        ).all()
        for bed in beds:
            if bed.bed_number <= num_beds:
                continue
            has_booking = session.exec(
                select(Booking.id).where(Booking.bed_id == bed.id)
            ).first()
            if bed.is_occupied or has_booking:
                continue
            session.delete(bed)

    for room in session.exec(select(Room)).all():
        if room.room_number in canonical_numbers:
            continue
        beds = session.exec(select(Bed).where(Bed.room_id == room.id)).all()
        if any(
            bed.is_occupied
            or session.exec(select(Booking.id).where(Booking.bed_id == bed.id)).first()
            for bed in beds
        ):
            continue
        for bed in beds:
            session.delete(bed)
        session.delete(room)

    session.commit()


def gender_to_room_gender(gender: Gender) -> RoomGender:
    return RoomGender.male if gender == Gender.male else RoomGender.female


def ensure_bed_can_be_assigned(session: Session, bed: Bed, student: Student) -> Room:
    if bed.is_occupied:
        raise HTTPException(status_code=400, detail="Bed is already occupied")
    room = session.get(Room, bed.room_id)
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    student_room_gender = gender_to_room_gender(student.gender)
    if room.gender not in (RoomGender.unassigned, student_room_gender):
        raise HTTPException(status_code=400, detail="Bed is not available for this student's gender")
    return room


def reset_room_gender_if_empty(session: Session, room: Room) -> None:
    occupied_bed = session.exec(
        select(Bed).where(Bed.room_id == room.id).where(Bed.is_occupied == True)
    ).first()
    if not occupied_bed:
        room.gender = RoomGender.unassigned
        session.add(room)


def is_finalist(student: Student, semester: Semester, year: int) -> bool:
    current_half_year = (year * 2) + (1 if semester == Semester.sem2 else 0)
    expected_half_year = ((student.year_joined + student.course_duration) * 2)
    if student.semester_joined == Semester.sem2:
        expected_half_year += 1
    return current_half_year >= expected_half_year


def active_booking_for_student(session: Session, student_id: int) -> Booking | None:
    return session.exec(
        select(Booking)
        .where(Booking.student_id == student_id)
        .where(Booking.status == BookingStatus.active)
        .order_by(Booking.year.desc(), Booking.semester.desc(), Booking.id.desc())
    ).first()
