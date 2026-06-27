from enum import Enum
from typing import Optional

from sqlmodel import Field, SQLModel


class RoomGender(str, Enum):
    male = "Male"
    female = "Female"
    unassigned = "Unassigned"


class RoomBase(SQLModel):
    room_number: str = Field(index=True)
    gender: RoomGender = RoomGender.unassigned
    price_per_bed: int


class Room(RoomBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)


class RoomUpdate(SQLModel):
    price_per_bed: Optional[int] = None


class RoomRead(RoomBase):
    id: int


class BedBase(SQLModel):
    room_id: int = Field(foreign_key="room.id")
    bed_number: int
    is_occupied: bool = False


class Bed(BedBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)


class BedRead(BedBase):
    id: int
