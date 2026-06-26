from typing import Optional
from sqlmodel import Field, SQLModel
from datetime import date
from enum import Enum

class AllocationStatus(str, Enum):
    active = "active"
    vacated = "vacated"
    transferred = "transferred"

class AllocationBase(SQLModel):
    booking_id: int = Field(foreign_key="booking.id")
    bed_id: int = Field(foreign_key="bed.id")
    student_id: int = Field(foreign_key="student.id")
    period_id: int = Field(foreign_key="academicperiod.id")
    allocated_on: date
    status: AllocationStatus = AllocationStatus.active

class Allocation(AllocationBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)

class AllocationCreate(AllocationBase):
    pass

class AllocationUpdate(SQLModel):
    status: Optional[AllocationStatus] = None
    bed_id: Optional[int] = None

class AllocationRead(AllocationBase):
    id: int