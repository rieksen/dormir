from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ConfigDict
from sqlmodel import Session, select

from database import get_session
from models_booking import Booking, BookingStatus
from models_payment import Payment, PaymentStatus
from models_room import Bed, Room
from models_student import Gender, Semester, Student, StudentCreate, StudentRead
from services_hostel import (
    active_booking_for_student,
    current_semester_year,
    ensure_bed_can_be_assigned,
    gender_to_room_gender,
    reset_room_gender_if_empty,
)

router = APIRouter()


class StudentRegistration(StudentCreate):
    bed_id: int


class BookingOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    student_id: int
    bed_id: int
    semester: Semester
    year: int
    status: BookingStatus


class PaymentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    booking_id: int
    amount: int
    status: PaymentStatus
    confirmed_at: datetime | None = None


class StudentRegistrationOut(BaseModel):
    student: StudentRead
    booking: BookingOut
    payment: PaymentOut


class ActiveStudentOut(BaseModel):
    id: int
    full_name: str
    phone: str
    emergency_contact: str
    university: str
    course: str
    year_of_study: int
    course_duration: int
    gender: Gender
    semester_joined: Semester
    year_joined: int
    booking_id: int
    bed_id: int
    room_id: int
    room_number: str
    bed_number: int
    semester: Semester
    year: int


@router.post('/register', response_model=StudentRegistrationOut, status_code=201)
def register_student(data: StudentRegistration, session: Session = Depends(get_session)):
    bed = session.get(Bed, data.bed_id)
    if not bed:
        raise HTTPException(status_code=404, detail='Bed not found')

    student = Student.model_validate(data.model_dump(exclude={'bed_id'}))
    room = ensure_bed_can_be_assigned(session, bed, student)
    semester, year = current_semester_year()

    try:
        session.add(student)
        session.flush()

        booking = Booking(
            student_id=student.id,
            bed_id=bed.id,
            semester=semester,
            year=year,
            status=BookingStatus.active,
        )
        session.add(booking)
        session.flush()

        payment = Payment(
            booking_id=booking.id,
            amount=room.price_per_bed,
            status=PaymentStatus.pending,
        )
        bed.is_occupied = True
        if room.gender.value == 'Unassigned':
            room.gender = gender_to_room_gender(student.gender)
        session.add(payment)
        session.add(bed)
        session.add(room)
        session.commit()
        session.refresh(student)
        session.refresh(booking)
        session.refresh(payment)
    except Exception:
        session.rollback()
        raise

    return StudentRegistrationOut(student=student, booking=booking, payment=payment)


@router.get('', response_model=list[ActiveStudentOut])
def list_students(session: Session = Depends(get_session)):
    rows = session.exec(
        select(Student, Booking, Bed, Room)
        .join(Booking, Booking.student_id == Student.id)
        .join(Bed, Booking.bed_id == Bed.id)
        .join(Room, Bed.room_id == Room.id)
        .where(Booking.status == BookingStatus.active)
        .order_by(Student.full_name)
    ).all()
    return [
        ActiveStudentOut(
            id=student.id,
            full_name=student.full_name,
            phone=student.phone,
            emergency_contact=student.emergency_contact,
            university=student.university,
            course=student.course,
            year_of_study=student.year_of_study,
            course_duration=student.course_duration,
            gender=student.gender,
            semester_joined=student.semester_joined,
            year_joined=student.year_joined,
            booking_id=booking.id,
            bed_id=bed.id,
            room_id=room.id,
            room_number=room.room_number,
            bed_number=bed.bed_number,
            semester=booking.semester,
            year=booking.year,
        )
        for student, booking, bed, room in rows
    ]


@router.post('/{student_id}/checkout', response_model=BookingOut)
def checkout_student(student_id: int, session: Session = Depends(get_session)):
    student = session.get(Student, student_id)
    if not student:
        raise HTTPException(status_code=404, detail='Student not found')
    booking = active_booking_for_student(session, student_id)
    if not booking:
        raise HTTPException(status_code=404, detail='Active booking not found')
    bed = session.get(Bed, booking.bed_id)
    if not bed:
        raise HTTPException(status_code=404, detail='Bed not found')
    room = session.get(Room, bed.room_id)
    if not room:
        raise HTTPException(status_code=404, detail='Room not found')

    booking.status = BookingStatus.checked_out
    bed.is_occupied = False
    session.add(booking)
    session.add(bed)
    reset_room_gender_if_empty(session, room)
    session.commit()
    session.refresh(booking)
    return booking
