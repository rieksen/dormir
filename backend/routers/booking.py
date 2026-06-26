from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from database import get_session
from models_booking import Booking, BookingCreate, BookingRead, BookingUpdate
from models_room import Room, Bed
from models_student import Student
from models_allocation import Allocation, AllocationStatus

router = APIRouter()

@router.get("/", response_model=list[BookingRead])
def list_bookings(session: Session = Depends(get_session)):
    return session.exec(select(Booking)).all()

@router.get("/{booking_id}", response_model=BookingRead)
def get_booking(booking_id: int, session: Session = Depends(get_session)):
    booking = session.get(Booking, booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    return booking

@router.post("/", response_model=BookingRead, status_code=201)
def create_booking(data: BookingCreate, session: Session = Depends(get_session)):
    room = session.get(Room, data.room_id)
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    if room.status == "maintenance":
        raise HTTPException(status_code=400, detail="Room is under maintenance")

    student = session.get(Student, data.student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    # gender constraint — check active allocations in this room for this period
    beds = session.exec(select(Bed).where(Bed.room_id == room.id)).all()
    bed_ids = [b.id for b in beds]
    active_allocations = session.exec(
        select(Allocation)
        .where(Allocation.bed_id.in_(bed_ids))
        .where(Allocation.period_id == data.period_id)
        .where(Allocation.status == AllocationStatus.active)
    ).all()
    if active_allocations:
        occupant = session.get(Student, active_allocations[0].student_id)
        if occupant.gender != student.gender:
            raise HTTPException(status_code=400, detail="Gender mismatch — room is occupied by {occupant.gender.value} students")

    # check room isn't already full for this period (including pending bookings)
    existing_bookings = session.exec(
        select(Booking)
        .where(Booking.room_id == room.id)
        .where(Booking.period_id == data.period_id)
        .where(Booking.status != "cancelled")
    ).all()
    capacity = 2 if room.room_type == "double" else 1
    if len(existing_bookings) >= capacity:
        raise HTTPException(status_code=400, detail="Room is fully booked for this period")

    booking = Booking.model_validate(data)
    session.add(booking)
    session.commit()
    session.refresh(booking)
    return booking

@router.patch("/{booking_id}", response_model=BookingRead)
def update_booking(booking_id: int, data: BookingUpdate, session: Session = Depends(get_session)):
    booking = session.get(Booking, booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(booking, field, value)
    session.add(booking)
    session.commit()
    session.refresh(booking)
    return booking

@router.delete("/{booking_id}", status_code=204)
def delete_booking(booking_id: int, session: Session = Depends(get_session)):
    booking = session.get(Booking, booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    session.delete(booking)
    session.commit()