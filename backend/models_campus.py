from typing import Optional
from sqlmodel import Field, SQLModel

class CampusBase(SQLModel):
    name: str = Field(index=True)
    location: str

class Campus(CampusBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)

class CampusCreate(CampusBase):
    pass

class CampusUpdate(SQLModel):
    name: Optional[str] = None
    location: Optional[str] = None

class CampusRead(CampusBase):
    id: int