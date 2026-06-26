from typing import Optional
from sqlmodel import Field, SQLModel
from datetime import date

class FeeBase(SQLModel):
    student_id: int = Field(foreign_key="student.id")
    period_id: int = Field(foreign_key="academicperiod.id")
    amount_due: int
    due_date: date

class Fee(FeeBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)

class FeeCreate(FeeBase):
    pass

class FeeUpdate(SQLModel):
    amount_due: Optional[int] = None
    due_date: Optional[date] = None

class FeeRead(FeeBase):
    id: int