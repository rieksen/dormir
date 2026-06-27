from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import func
from sqlmodel import Session, select

from database import get_session
from models_booking import Booking, BookingStatus
from models_payment import Payment, PaymentStatus
from models_room import Bed, Room, RoomGender
from models_student import Semester, Student
from services_hostel import HOSTEL_ROOM_NUMBERS, current_semester_year

router = APIRouter()


class OccupancyBedOut(BaseModel):
    bed_id: int
    bed_number: int
    is_occupied: bool
    student_name: str | None = None


class OccupancyOut(BaseModel):
    room_id: int
    room_number: str
    gender: RoomGender
    occupied_beds: int
    available_beds: int
    total_beds: int
    beds: list[OccupancyBedOut]


class UnpaidOut(BaseModel):
    student_id: int
    full_name: str
    booking_id: int
    payment_id: int
    room_number: str
    bed_number: int
    semester: Semester
    year: int
    amount: int


class PriceOut(BaseModel):
    room_id: int
    room_number: str
    price_per_bed: int


class SummaryOut(BaseModel):
    total_students: int
    revenue_collected: int
    pending: int
    occupied_beds: int
    total_beds: int
    current_prices: list[PriceOut]


@router.get('/occupancy', response_model=list[OccupancyOut])
def occupancy(session: Session = Depends(get_session)):
    rooms = session.exec(select(Room).where(Room.room_number.in_(HOSTEL_ROOM_NUMBERS)).order_by(Room.room_number)).all()
    result = []
    for room in rooms:
        beds = session.exec(select(Bed).where(Bed.room_id == room.id).order_by(Bed.bed_number)).all()
        bed_rows = []
        for bed in beds:
            active = session.exec(
                select(Booking, Student)
                .join(Student, Booking.student_id == Student.id)
                .where(Booking.bed_id == bed.id)
                .where(Booking.status == BookingStatus.active)
            ).first()
            student_name = active[1].full_name if active else None
            bed_rows.append(OccupancyBedOut(
                bed_id=bed.id,
                bed_number=bed.bed_number,
                is_occupied=bed.is_occupied,
                student_name=student_name,
            ))
        occupied = sum(1 for bed in beds if bed.is_occupied)
        result.append(OccupancyOut(
            room_id=room.id,
            room_number=room.room_number,
            gender=room.gender,
            occupied_beds=occupied,
            available_beds=len(beds) - occupied,
            total_beds=len(beds),
            beds=bed_rows,
        ))
    return result


@router.get('/unpaid', response_model=list[UnpaidOut])
def unpaid(session: Session = Depends(get_session)):
    semester, year = current_semester_year()
    rows = session.exec(
        select(Payment, Booking, Student, Bed, Room)
        .join(Booking, Payment.booking_id == Booking.id)
        .join(Student, Booking.student_id == Student.id)
        .join(Bed, Booking.bed_id == Bed.id)
        .join(Room, Bed.room_id == Room.id)
        .where(Room.room_number.in_(HOSTEL_ROOM_NUMBERS))
        .where(Payment.status == PaymentStatus.pending)
        .where(Booking.semester == semester)
        .where(Booking.year == year)
        .order_by(Student.full_name)
    ).all()
    return [
        UnpaidOut(
            student_id=student.id,
            full_name=student.full_name,
            booking_id=booking.id,
            payment_id=payment.id,
            room_number=room.room_number,
            bed_number=bed.bed_number,
            semester=booking.semester,
            year=booking.year,
            amount=payment.amount,
        )
        for payment, booking, student, bed, room in rows
    ]


@router.get('/summary', response_model=SummaryOut)
def summary(session: Session = Depends(get_session)):
    semester, year = current_semester_year()
    total_students = session.exec(
        select(func.count(Booking.id))
        .join(Bed, Booking.bed_id == Bed.id)
        .join(Room, Bed.room_id == Room.id)
        .where(Room.room_number.in_(HOSTEL_ROOM_NUMBERS))
        .where(Booking.status == BookingStatus.active)
    ).one()
    revenue_collected = session.exec(
        select(func.coalesce(func.sum(Payment.amount), 0))
        .join(Booking, Payment.booking_id == Booking.id)
        .join(Bed, Booking.bed_id == Bed.id)
        .join(Room, Bed.room_id == Room.id)
        .where(Room.room_number.in_(HOSTEL_ROOM_NUMBERS))
        .where(Payment.status == PaymentStatus.confirmed)
        .where(Booking.semester == semester)
        .where(Booking.year == year)
    ).one() or 0
    pending = session.exec(
        select(func.coalesce(func.sum(Payment.amount), 0))
        .join(Booking, Payment.booking_id == Booking.id)
        .join(Bed, Booking.bed_id == Bed.id)
        .join(Room, Bed.room_id == Room.id)
        .where(Room.room_number.in_(HOSTEL_ROOM_NUMBERS))
        .where(Payment.status == PaymentStatus.pending)
        .where(Booking.semester == semester)
        .where(Booking.year == year)
    ).one() or 0
    occupied_beds = session.exec(
        select(func.count(Bed.id))
        .join(Room, Bed.room_id == Room.id)
        .where(Room.room_number.in_(HOSTEL_ROOM_NUMBERS))
        .where(Bed.is_occupied == True)
    ).one()
    total_beds = session.exec(
        select(func.count(Bed.id))
        .join(Room, Bed.room_id == Room.id)
        .where(Room.room_number.in_(HOSTEL_ROOM_NUMBERS))
    ).one()
    rooms = session.exec(select(Room).where(Room.room_number.in_(HOSTEL_ROOM_NUMBERS)).order_by(Room.room_number)).all()
    prices = [PriceOut(room_id=room.id, room_number=room.room_number, price_per_bed=room.price_per_bed) for room in rooms]
    return SummaryOut(
        total_students=total_students,
        revenue_collected=revenue_collected,
        pending=pending,
        occupied_beds=occupied_beds,
        total_beds=total_beds,
        current_prices=prices,
    )
