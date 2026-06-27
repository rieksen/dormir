from enum import Enum
from typing import Optional

from sqlmodel import Field, SQLModel

from models_student import Semester


class BookingStatus(str, Enum):
    active = "active"
    checked_out = "checked_out"


class BookingBase(SQLModel):
    student_id: int = Field(foreign_key="student.id")
    bed_id: int = Field(foreign_key="bed.id")
    semester: Semester
    year: int
    status: BookingStatus = BookingStatus.active


class Booking(BookingBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)


class BookingUpdate(SQLModel):
    status: Optional[BookingStatus] = None


class BookingRead(BookingBase):
    id: int
