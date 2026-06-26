from fastapi import APIRouter, Depends, Query
from sqlmodel import Session, select
from sqlalchemy import func
from typing import Optional
from datetime import date
from pydantic import BaseModel
from database import get_session
from models_campus import Campus
from models_room import Room, Bed, RoomStatus
from models_period import AcademicPeriod
from models_student import Student
from models_booking import Booking, BookingStatus
from models_allocation import Allocation, AllocationStatus
from models_fee import Fee
from models_payment import Payment

router = APIRouter()


# ── Response schemas ──────────────────────────────────────────────────────────

class DashboardSummary(BaseModel):
    total_students: int
    total_rooms: int
    total_beds: int
    occupied_beds: int
    available_beds: int
    occupancy_rate: float
    rooms_under_maintenance: int
    active_period_id: Optional[int]
    active_period_name: Optional[str]
    pending_bookings: int
    confirmed_bookings: int
    total_fees_due: int
    total_collected: int
    outstanding_balance: int

class CampusOccupancy(BaseModel):
    campus_id: int
    campus_name: str
    total_beds: int
    occupied_beds: int
    occupancy_rate: float

class RecentPaymentOut(BaseModel):
    student_name: str
    amount_paid: int
    paid_on: date
    method: str

class RecentBookingOut(BaseModel):
    student_name: str
    room_number: str
    period_name: str
    status: str
    paid_on: date


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/summary", response_model=DashboardSummary)
def summary(session: Session = Depends(get_session)):
    active_period = session.exec(
        select(AcademicPeriod).where(AcademicPeriod.is_active == True)
    ).first()

    total_students = session.exec(select(func.count(Student.id))).one()
    total_rooms    = session.exec(select(func.count(Room.id))).one()
    total_beds     = session.exec(select(func.count(Bed.id))).one()

    rooms_under_maintenance = session.exec(
        select(func.count(Room.id)).where(Room.status == RoomStatus.maintenance)
    ).one()

    occupied_beds   = 0
    total_fees_due  = 0
    total_collected = 0

    if active_period:
        occupied_beds = session.exec(
            select(func.count(Allocation.id))
            .where(Allocation.period_id == active_period.id)
            .where(Allocation.status == AllocationStatus.active)
        ).one()

        total_fees_due = session.exec(
            select(func.coalesce(func.sum(Fee.amount_due), 0))
            .where(Fee.period_id == active_period.id)
        ).one() or 0

        total_collected = session.exec(
            select(func.coalesce(func.sum(Payment.amount_paid), 0))
            .join(Fee, Payment.fee_id == Fee.id)
            .where(Fee.period_id == active_period.id)
        ).one() or 0

    pending_bookings = session.exec(
        select(func.count(Booking.id)).where(Booking.status == BookingStatus.pending)
    ).one()

    confirmed_bookings = session.exec(
        select(func.count(Booking.id)).where(Booking.status == BookingStatus.confirmed)
    ).one()

    available_beds      = total_beds - occupied_beds
    occupancy_rate      = round(occupied_beds / total_beds * 100, 1) if total_beds else 0.0
    outstanding_balance = total_fees_due - total_collected

    return DashboardSummary(
        total_students=total_students,
        total_rooms=total_rooms,
        total_beds=total_beds,
        occupied_beds=occupied_beds,
        available_beds=available_beds,
        occupancy_rate=occupancy_rate,
        rooms_under_maintenance=rooms_under_maintenance,
        active_period_id=active_period.id if active_period else None,
        active_period_name=active_period.name if active_period else None,
        pending_bookings=pending_bookings,
        confirmed_bookings=confirmed_bookings,
        total_fees_due=total_fees_due,
        total_collected=total_collected,
        outstanding_balance=outstanding_balance,
    )


@router.get("/occupancy", response_model=list[CampusOccupancy])
def campus_occupancy(session: Session = Depends(get_session)):
    active_period = session.exec(
        select(AcademicPeriod).where(AcademicPeriod.is_active == True)
    ).first()

    campuses = session.exec(select(Campus)).all()
    result   = []

    for campus in campuses:
        total = session.exec(
            select(func.count(Bed.id))
            .join(Room, Bed.room_id == Room.id)
            .where(Room.campus_id == campus.id)
        ).one()

        occupied = 0
        if active_period:
            occupied = session.exec(
                select(func.count(Allocation.id))
                .join(Bed, Allocation.bed_id == Bed.id)
                .join(Room, Bed.room_id == Room.id)
                .where(Room.campus_id == campus.id)
                .where(Allocation.period_id == active_period.id)
                .where(Allocation.status == AllocationStatus.active)
            ).one()

        result.append(CampusOccupancy(
            campus_id=campus.id,
            campus_name=campus.name,
            total_beds=total,
            occupied_beds=occupied,
            occupancy_rate=round(occupied / total * 100, 1) if total else 0.0,
        ))

    return result


@router.get("/recent-payments", response_model=list[RecentPaymentOut])
def recent_payments(
    limit: int = Query(default=10, le=50),
    session: Session = Depends(get_session),
):
    rows = session.exec(
        select(Payment, Fee, Student)
        .join(Fee, Payment.fee_id == Fee.id)
        .join(Student, Fee.student_id == Student.id)
        .order_by(Payment.paid_on.desc())
        .limit(limit)
    ).all()

    return [
        RecentPaymentOut(
            student_name=f"{student.first_name} {student.last_name}",
            amount_paid=payment.amount_paid,
            paid_on=payment.paid_on,
            method=payment.method,
        )
        for payment, fee, student in rows
    ]


@router.get("/recent-bookings", response_model=list[RecentBookingOut])
def recent_bookings(
    limit: int = Query(default=10, le=50),
    session: Session = Depends(get_session),
):
    rows = session.exec(
        select(Booking, Student, Room, AcademicPeriod)
        .join(Student, Booking.student_id == Student.id)
        .join(Room, Booking.room_id == Room.id)
        .join(AcademicPeriod, Booking.period_id == AcademicPeriod.id)
        .order_by(Booking.paid_on.desc())
        .limit(limit)
    ).all()

    return [
        RecentBookingOut(
            student_name=f"{student.first_name} {student.last_name}",
            room_number=room.room_number,
            period_name=period.name,
            status=booking.status,
            paid_on=booking.paid_on,
        )
        for booking, student, room, period in rows
    ]