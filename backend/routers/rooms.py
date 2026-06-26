from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from database import get_session
from models_room import Room, RoomCreate, RoomRead, RoomUpdate, Bed, BedCreate, BedRead

router = APIRouter()

# --- Rooms ---

@router.get("/", response_model=list[RoomRead])
def list_rooms(session: Session = Depends(get_session)):
    return session.exec(select(Room)).all()

@router.get("/{room_id}", response_model=RoomRead)
def get_room(room_id: int, session: Session = Depends(get_session)):
    room = session.get(Room, room_id)
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    return room

@router.post("/", response_model=RoomRead, status_code=201)
def create_room(data: RoomCreate, session: Session = Depends(get_session)):
    room = Room.model_validate(data)
    session.add(room)
    session.commit()
    session.refresh(room)
    # auto-create beds based on room type
    labels = ["A", "B"] if room.room_type == "double" else ["A"]
    for label in labels:
        session.add(Bed(room_id=room.id, label=label))
    session.commit()
    return room

@router.patch("/{room_id}", response_model=RoomRead)
def update_room(room_id: int, data: RoomUpdate, session: Session = Depends(get_session)):
    room = session.get(Room, room_id)
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(room, field, value)
    session.add(room)
    session.commit()
    session.refresh(room)
    return room

@router.delete("/{room_id}", status_code=204)
def delete_room(room_id: int, session: Session = Depends(get_session)):
    room = session.get(Room, room_id)
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    session.delete(room)
    session.commit()

# --- Beds ---

@router.get("/{room_id}/beds", response_model=list[BedRead])
def list_beds(room_id: int, session: Session = Depends(get_session)):
    return session.exec(select(Bed).where(Bed.room_id == room_id)).all()

@router.post("/{room_id}/beds", response_model=BedRead, status_code=201)
def create_bed(room_id: int, data: BedCreate, session: Session = Depends(get_session)):
    room = session.get(Room, room_id)
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    bed = Bed.model_validate(data)
    session.add(bed)
    session.commit()
    session.refresh(bed)
    return bed