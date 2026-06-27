from enum import Enum
from typing import Optional

from sqlmodel import Field, SQLModel


class Gender(str, Enum):
    male = "Male"
    female = "Female"


class Semester(str, Enum):
    sem1 = "Sem1"
    sem2 = "Sem2"


class StudentBase(SQLModel):
    full_name: str = Field(index=True)
    phone: str
    emergency_contact: str
    university: str
    course: str
    year_of_study: int
    course_duration: int
    gender: Gender
    semester_joined: Semester
    year_joined: int


class Student(StudentBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)


class StudentCreate(StudentBase):
    pass


class StudentUpdate(SQLModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    emergency_contact: Optional[str] = None
    university: Optional[str] = None
    course: Optional[str] = None
    year_of_study: Optional[int] = None
    course_duration: Optional[int] = None
    gender: Optional[Gender] = None
    semester_joined: Optional[Semester] = None
    year_joined: Optional[int] = None


class StudentRead(StudentBase):
    id: int
