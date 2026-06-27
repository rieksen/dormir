from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlmodel import Session, select

from database import get_session
from models_booking import Booking
from models_payment import Payment, PaymentStatus
from models_room import Bed, Room
from models_student import Semester, Student

router = APIRouter()


class PaymentOut(BaseModel):
    id: int
    booking_id: int
    student_id: int
    student_name: str
    room_number: str
    bed_number: int
    semester: Semester
    year: int
    amount: int
    status: PaymentStatus
    confirmed_at: datetime | None


@router.get('/pending', response_model=list[PaymentOut])
def pending_payments(session: Session = Depends(get_session)):
    rows = session.exec(
        select(Payment, Booking, Student, Bed, Room)
        .join(Booking, Payment.booking_id == Booking.id)
        .join(Student, Booking.student_id == Student.id)
        .join(Bed, Booking.bed_id == Bed.id)
        .join(Room, Bed.room_id == Room.id)
        .where(Payment.status == PaymentStatus.pending)
        .order_by(Student.full_name)
    ).all()
    return [
        PaymentOut(
            id=payment.id,
            booking_id=booking.id,
            student_id=student.id,
            student_name=student.full_name,
            room_number=room.room_number,
            bed_number=bed.bed_number,
            semester=booking.semester,
            year=booking.year,
            amount=payment.amount,
            status=payment.status,
            confirmed_at=payment.confirmed_at,
        )
        for payment, booking, student, bed, room in rows
    ]


@router.post('/{payment_id}/confirm', response_model=PaymentOut)
def confirm_payment(payment_id: int, session: Session = Depends(get_session)):
    payment = session.get(Payment, payment_id)
    if not payment:
        raise HTTPException(status_code=404, detail='Payment not found')
    booking = session.get(Booking, payment.booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail='Booking not found')
    student = session.get(Student, booking.student_id)
    bed = session.get(Bed, booking.bed_id)
    room = session.get(Room, bed.room_id) if bed else None
    if not student or not bed or not room:
        raise HTTPException(status_code=404, detail='Payment relationship not found')

    payment.status = PaymentStatus.confirmed
    payment.confirmed_at = datetime.now(timezone.utc)
    session.add(payment)
    session.commit()
    session.refresh(payment)
    return PaymentOut(
        id=payment.id,
        booking_id=booking.id,
        student_id=student.id,
        student_name=student.full_name,
        room_number=room.room_number,
        bed_number=bed.bed_number,
        semester=booking.semester,
        year=booking.year,
        amount=payment.amount,
        status=payment.status,
        confirmed_at=payment.confirmed_at,
    )
