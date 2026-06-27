from pydantic import BaseModel
from fastapi import APIRouter, Depends
from sqlmodel import Session, select

from database import get_session
from models_booking import Booking, BookingStatus
from models_payment import Payment, PaymentStatus
from models_room import Bed, Room
from models_student import Semester, Student
from services_hostel import is_finalist, next_semester_year

router = APIRouter()


class RolloverStudentOut(BaseModel):
    student_id: int
    full_name: str
    booking_id: int
    bed_id: int
    semester: Semester
    year: int


class RenewedStudentOut(RolloverStudentOut):
    new_booking_id: int
    payment_id: int
    amount: int


class RolloverOut(BaseModel):
    finalists: list[RolloverStudentOut]
    renewed_students: list[RenewedStudentOut]


@router.post('/rollover', response_model=RolloverOut)
def rollover_semester(session: Session = Depends(get_session)):
    active_bookings = session.exec(
        select(Booking).where(Booking.status == BookingStatus.active).order_by(Booking.id)
    ).all()
    finalists: list[RolloverStudentOut] = []
    renewed: list[RenewedStudentOut] = []

    for booking in active_bookings:
        student = session.get(Student, booking.student_id)
        bed = session.get(Bed, booking.bed_id)
        room = session.get(Room, bed.room_id) if bed else None
        if not student or not bed or not room:
            continue

        next_semester, next_year = next_semester_year(booking.semester, booking.year)
        base = RolloverStudentOut(
            student_id=student.id,
            full_name=student.full_name,
            booking_id=booking.id,
            bed_id=bed.id,
            semester=next_semester,
            year=next_year,
        )
        if is_finalist(student, next_semester, next_year):
            finalists.append(base)
            continue

        existing = session.exec(
            select(Booking)
            .where(Booking.student_id == student.id)
            .where(Booking.bed_id == bed.id)
            .where(Booking.semester == next_semester)
            .where(Booking.year == next_year)
        ).first()
        if existing:
            payment = session.exec(select(Payment).where(Payment.booking_id == existing.id)).first()
            renewed.append(RenewedStudentOut(
                **base.model_dump(),
                new_booking_id=existing.id,
                payment_id=payment.id if payment else 0,
                amount=payment.amount if payment else 0,
            ))
            continue

        booking.status = BookingStatus.checked_out
        new_booking = Booking(
            student_id=student.id,
            bed_id=bed.id,
            semester=next_semester,
            year=next_year,
            status=BookingStatus.active,
        )
        session.add(booking)
        session.add(new_booking)
        session.flush()
        payment = Payment(
            booking_id=new_booking.id,
            amount=room.price_per_bed,
            status=PaymentStatus.pending,
        )
        session.add(payment)
        session.flush()
        renewed.append(RenewedStudentOut(
            **base.model_dump(),
            new_booking_id=new_booking.id,
            payment_id=payment.id,
            amount=payment.amount,
        ))

    session.commit()
    return RolloverOut(finalists=finalists, renewed_students=renewed)
