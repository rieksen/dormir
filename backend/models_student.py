from typing import Optional
from sqlmodel import Field, SQLModel
from enum import Enum

class Gender(str, Enum):
    male = "male"
    female = "female"

class StudentBase(SQLModel):
    student_number: str = Field(index=True)
    first_name: str
    last_name: str
    gender: Gender
    phone: str
    email: Optional[str] = None
    school: str
    course: Optional[str] = None
    year_of_study: Optional[int] = None

class Student(StudentBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)

class StudentCreate(StudentBase):
    pass

class StudentUpdate(SQLModel):
    student_number: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    gender: Optional[Gender] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    school: Optional[str] = None
    course: Optional[str] = None
    year_of_study: Optional[int] = None

class StudentRead(StudentBase):
    id: int