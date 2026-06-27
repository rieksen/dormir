from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlmodel import Session, select

from database import get_session
from models_room import Bed, Room, RoomGender
from models_student import Gender
from services_hostel import HOSTEL_ROOM_NUMBERS, gender_to_room_gender

router = APIRouter()


class AvailableBedOut(BaseModel):
    id: int
    room_id: int
    room_number: str
    room_gender: RoomGender
    bed_number: int
    price_per_bed: int
    is_occupied: bool


@router.get('/available', response_model=list[AvailableBedOut])
def available_beds(gender: Gender = Query(...), session: Session = Depends(get_session)):
    requested_room_gender = gender_to_room_gender(gender)
    rows = session.exec(
        select(Bed, Room)
        .join(Room, Bed.room_id == Room.id)
        .where(Bed.is_occupied == False)
        .where(Room.room_number.in_(HOSTEL_ROOM_NUMBERS))
        .where(Room.gender.in_([RoomGender.unassigned, requested_room_gender]))
        .order_by(Room.room_number, Bed.bed_number)
    ).all()
    return [
        AvailableBedOut(
            id=bed.id,
            room_id=room.id,
            room_number=room.room_number,
            room_gender=room.gender,
            bed_number=bed.bed_number,
            price_per_bed=room.price_per_bed,
            is_occupied=bed.is_occupied,
        )
        for bed, room in rows
    ]
