from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import func
from sqlmodel import Session, select

from database import get_session
from models_booking import Booking, BookingStatus
from models_payment import Payment, PaymentStatus
from models_room import Bed, Room
from models_student import Semester, Student
from services_hostel import HOSTEL_ROOM_NUMBERS, current_semester_year

router = APIRouter()


class DashboardSummaryOut(BaseModel):
    total_students: int
    total_rooms: int
    total_beds: int
    occupied_beds: int
    available_beds: int
    occupancy_rate: float
    pending_bookings: int       # payments pending (unpaid)
    confirmed_bookings: int     # payments confirmed (paid)
    revenue_collected: int      # UGX confirmed this semester
    outstanding: int            # UGX pending this semester


class RecentPaymentOut(BaseModel):
    student_name: str
    room_number: str
    bed_number: int
    amount: int
    status: PaymentStatus
    confirmed_at: datetime | None


class RecentBookingOut(BaseModel):
    student_name: str
    room_number: str
    bed_number: int
    semester: Semester
    year: int
    status: BookingStatus


@router.get("/summary", response_model=DashboardSummaryOut)
def dashboard_summary(session: Session = Depends(get_session)):
    semester, year = current_semester_year()

    total_students = session.exec(
        select(func.count(Booking.id))
        .join(Bed, Booking.bed_id == Bed.id)
        .join(Room, Bed.room_id == Room.id)
        .where(Room.room_number.in_(HOSTEL_ROOM_NUMBERS))
        .where(Booking.status == BookingStatus.active)
    ).one()

    total_rooms = session.exec(
        select(func.count(Room.id)).where(Room.room_number.in_(HOSTEL_ROOM_NUMBERS))
    ).one()

    total_beds = session.exec(
        select(func.count(Bed.id))
        .join(Room, Bed.room_id == Room.id)
        .where(Room.room_number.in_(HOSTEL_ROOM_NUMBERS))
    ).one()

    occupied_beds = session.exec(
        select(func.count(Bed.id))
        .join(Room, Bed.room_id == Room.id)
        .where(Room.room_number.in_(HOSTEL_ROOM_NUMBERS))
        .where(Bed.is_occupied == True)
    ).one()

    available_beds = total_beds - occupied_beds
    occupancy_rate = round((occupied_beds / total_beds * 100) if total_beds else 0, 1)

    pending_bookings = session.exec(
        select(func.count(Payment.id))
        .join(Booking, Payment.booking_id == Booking.id)
        .join(Bed, Booking.bed_id == Bed.id)
        .join(Room, Bed.room_id == Room.id)
        .where(Room.room_number.in_(HOSTEL_ROOM_NUMBERS))
        .where(Payment.status == PaymentStatus.pending)
        .where(Booking.semester == semester)
        .where(Booking.year == year)
    ).one()

    confirmed_bookings = session.exec(
        select(func.count(Payment.id))
        .join(Booking, Payment.booking_id == Booking.id)
        .join(Bed, Booking.bed_id == Bed.id)
        .join(Room, Bed.room_id == Room.id)
        .where(Room.room_number.in_(HOSTEL_ROOM_NUMBERS))
        .where(Payment.status == PaymentStatus.confirmed)
        .where(Booking.semester == semester)
        .where(Booking.year == year)
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

    outstanding = session.exec(
        select(func.coalesce(func.sum(Payment.amount), 0))
        .join(Booking, Payment.booking_id == Booking.id)
        .join(Bed, Booking.bed_id == Bed.id)
        .join(Room, Bed.room_id == Room.id)
        .where(Room.room_number.in_(HOSTEL_ROOM_NUMBERS))
        .where(Payment.status == PaymentStatus.pending)
        .where(Booking.semester == semester)
        .where(Booking.year == year)
    ).one() or 0

    return DashboardSummaryOut(
        total_students=total_students,
        total_rooms=total_rooms,
        total_beds=total_beds,
        occupied_beds=occupied_beds,
        available_beds=available_beds,
        occupancy_rate=occupancy_rate,
        pending_bookings=pending_bookings,
        confirmed_bookings=confirmed_bookings,
        revenue_collected=revenue_collected,
        outstanding=outstanding,
    )


@router.get("/recent-payments", response_model=list[RecentPaymentOut])
def recent_payments(limit: int = 10, session: Session = Depends(get_session)):
    rows = session.exec(
        select(Payment, Booking, Student, Bed, Room)
        .join(Booking, Payment.booking_id == Booking.id)
        .join(Student, Booking.student_id == Student.id)
        .join(Bed, Booking.bed_id == Bed.id)
        .join(Room, Bed.room_id == Room.id)
        .where(Room.room_number.in_(HOSTEL_ROOM_NUMBERS))
        .order_by(Payment.id.desc())
        .limit(limit)
    ).all()
    return [
        RecentPaymentOut(
            student_name=student.full_name,
            room_number=room.room_number,
            bed_number=bed.bed_number,
            amount=payment.amount,
            status=payment.status,
            confirmed_at=payment.confirmed_at,
        )
        for payment, booking, student, bed, room in rows
    ]


@router.get("/recent-bookings", response_model=list[RecentBookingOut])
def recent_bookings(limit: int = 10, session: Session = Depends(get_session)):
    rows = session.exec(
        select(Booking, Student, Bed, Room)
        .join(Student, Booking.student_id == Student.id)
        .join(Bed, Booking.bed_id == Bed.id)
        .join(Room, Bed.room_id == Room.id)
        .where(Room.room_number.in_(HOSTEL_ROOM_NUMBERS))
        .order_by(Booking.id.desc())
        .limit(limit)
    ).all()
    return [
        RecentBookingOut(
            student_name=student.full_name,
            room_number=room.room_number,
            bed_number=bed.bed_number,
            semester=booking.semester,
            year=booking.year,
            status=booking.status,
        )
        for booking, student, bed, room in rows
    ]
