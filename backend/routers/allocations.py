from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from datetime import date
from database import get_session
from models_allocation import Allocation, AllocationCreate, AllocationRead, AllocationUpdate
from models_booking import Booking, BookingStatus
from models_fee import Fee
from models_period import AcademicPeriod
from models_room import Bed, Room

router = APIRouter()

@router.get("/", response_model=list[AllocationRead])
def list_allocations(session: Session = Depends(get_session)):
    return session.exec(select(Allocation)).all()

@router.get("/{allocation_id}", response_model=AllocationRead)
def get_allocation(allocation_id: int, session: Session = Depends(get_session)):
    allocation = session.get(Allocation, allocation_id)
    if not allocation:
        raise HTTPException(status_code=404, detail="Allocation not found")
    return allocation

@router.post("/", response_model=AllocationRead, status_code=201)
def create_allocation(data: AllocationCreate, session: Session = Depends(get_session)):
    booking = session.get(Booking, data.booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking.status != BookingStatus.confirmed:
        raise HTTPException(status_code=400, detail="Booking must be confirmed before allocating")

    bed = session.get(Bed, data.bed_id)
    if not bed:
        raise HTTPException(status_code=404, detail="Bed not found")

    # generate fee automatically
    room = session.get(Room, bed.room_id)
    period = session.get(AcademicPeriod, data.period_id)
    amount_due = room.price_per_bed - booking.amount_paid

    allocation = Allocation.model_validate(data)
    session.add(allocation)
    session.commit()
    session.refresh(allocation)

    fee = Fee(
        student_id=data.student_id,
        period_id=data.period_id,
        amount_due=amount_due,
        due_date=period.start_date,
    )
    session.add(fee)

    # update room status
    beds = session.exec(select(Bed).where(Bed.room_id == room.id)).all()
    active_count = sum(
        1 for b in beds
        if session.exec(
            select(Allocation)
            .where(Allocation.bed_id == b.id)
            .where(Allocation.period_id == data.period_id)
            .where(Allocation.status == "active")
        ).first()
    )
    if active_count >= len(beds):
        room.status = "full"
        session.add(room)

    session.commit()
    return allocation

@router.patch("/{allocation_id}", response_model=AllocationRead)
def update_allocation(allocation_id: int, data: AllocationUpdate, session: Session = Depends(get_session)):
    allocation = session.get(Allocation, allocation_id)
    if not allocation:
        raise HTTPException(status_code=404, detail="Allocation not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(allocation, field, value)
    session.add(allocation)
    session.commit()
    session.refresh(allocation)
    return allocation

@router.delete("/{allocation_id}", status_code=204)
def delete_allocation(allocation_id: int, session: Session = Depends(get_session)):
    allocation = session.get(Allocation, allocation_id)
    if not allocation:
        raise HTTPException(status_code=404, detail="Allocation not found")
    session.delete(allocation)
    session.commit()