from typing import Optional
from sqlmodel import Field, SQLModel
from datetime import date

class AcademicPeriodBase(SQLModel):
    name: str = Field(index=True)  # "2025/26 Sem 1"
    start_date: date
    end_date: date
    is_active: bool = False

class AcademicPeriod(AcademicPeriodBase, table=True):
    __tablename__ = "academicperiod"
    id: Optional[int] = Field(default=None, primary_key=True)

class AcademicPeriodCreate(AcademicPeriodBase):
    pass

class AcademicPeriodUpdate(SQLModel):
    name: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    is_active: Optional[bool] = None

class AcademicPeriodRead(AcademicPeriodBase):
    id: int