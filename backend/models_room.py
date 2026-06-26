from typing import Optional
from sqlmodel import Field, SQLModel
from enum import Enum

class RoomType(str, Enum):
    single = "single"
    double = "double"

class RoomStatus(str, Enum):
    available = "available"
    full = "full"
    maintenance = "maintenance"

class RoomBase(SQLModel):
    campus_id: int = Field(foreign_key="campus.id")
    room_number: str = Field(index=True)
    room_type: RoomType
    price_per_bed: int
    floor: Optional[int] = None
    status: RoomStatus = RoomStatus.available

class Room(RoomBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)

class RoomCreate(RoomBase):
    pass

class RoomUpdate(SQLModel):
    campus_id: Optional[int] = None
    room_number: Optional[str] = None
    room_type: Optional[RoomType] = None
    price_per_bed: Optional[int] = None
    floor: Optional[int] = None
    status: Optional[RoomStatus] = None

class RoomRead(RoomBase):
    id: int


class BedBase(SQLModel):
    room_id: int = Field(foreign_key="room.id")
    label: str  # "A" or "B"

class Bed(BedBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)

class BedCreate(BedBase):
    pass

class BedRead(BedBase):
    id: int