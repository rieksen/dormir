from typing import Optional
from sqlmodel import Field, SQLModel
from datetime import date
from enum import Enum

class BookingStatus(str, Enum):
    pending = "pending"
    confirmed = "confirmed"
    cancelled = "cancelled"

class BookingBase(SQLModel):
    student_id: int = Field(foreign_key="student.id")
    room_id: int = Field(foreign_key="room.id")
    period_id: int = Field(foreign_key="academicperiod.id")
    amount_paid: int
    paid_on: date
    status: BookingStatus = BookingStatus.pending

class Booking(BookingBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)

class BookingCreate(BookingBase):
    pass

class BookingUpdate(SQLModel):
    status: Optional[BookingStatus] = None
    amount_paid: Optional[int] = None
    paid_on: Optional[date] = None

class BookingRead(BookingBase):
    id: int