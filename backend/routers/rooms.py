from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlmodel import Session, select

from database import get_session
from models_booking import Booking, BookingStatus
from models_room import Bed, Room, RoomGender
from services_hostel import HOSTEL_ROOM_NUMBERS

router = APIRouter()


class RoomPriceUpdate(BaseModel):
    price_per_bed: int


class RoomBedOut(BaseModel):
    bed_id: int
    bed_number: int
    is_occupied: bool


class RoomOut(BaseModel):
    id: int
    room_number: str
    gender: RoomGender
    price_per_bed: int
    occupied_beds: int
    available_beds: int
    beds: list[RoomBedOut]


def room_payload(session: Session, room: Room) -> RoomOut:
    beds = session.exec(select(Bed).where(Bed.room_id == room.id).order_by(Bed.bed_number)).all()
    occupied = sum(1 for bed in beds if bed.is_occupied)
    return RoomOut(
        id=room.id,
        room_number=room.room_number,
        gender=room.gender,
        price_per_bed=room.price_per_bed,
        occupied_beds=occupied,
        available_beds=len(beds) - occupied,
        beds=[RoomBedOut(bed_id=bed.id, bed_number=bed.bed_number, is_occupied=bed.is_occupied) for bed in beds],
    )


@router.get('', response_model=list[RoomOut])
def list_rooms(session: Session = Depends(get_session)):
    rooms = session.exec(select(Room).where(Room.room_number.in_(HOSTEL_ROOM_NUMBERS)).order_by(Room.room_number)).all()
    return [room_payload(session, room) for room in rooms]


@router.put('/{room_id}/price', response_model=RoomOut)
def update_room_price(room_id: int, data: RoomPriceUpdate, session: Session = Depends(get_session)):
    if data.price_per_bed < 0:
        raise HTTPException(status_code=400, detail='Price per bed cannot be negative')
    room = session.get(Room, room_id)
    if not room:
        raise HTTPException(status_code=404, detail='Room not found')
    if room.room_number not in HOSTEL_ROOM_NUMBERS:
        raise HTTPException(status_code=404, detail='Room not found')
    room.price_per_bed = data.price_per_bed
    session.add(room)
    session.commit()
    session.refresh(room)
    return room_payload(session, room)
