from typing import Optional
from sqlmodel import Field, SQLModel


class UnitBase(SQLModel):
    number: str = Field(index=True)
    floor: int
    bedrooms: int  # 0 = Studio
    bathrooms: int
    rent: int  # UGX per month
    status: str = Field(default="Vacant")  # Occupied | Vacant | Maintenance
    tenant: Optional[str] = Field(default=None)


class Unit(UnitBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)


class UnitCreate(UnitBase):
    pass


class UnitUpdate(SQLModel):
    number: Optional[str] = None
    floor: Optional[int] = None
    bedrooms: Optional[int] = None
    bathrooms: Optional[int] = None
    rent: Optional[int] = None
    status: Optional[str] = None
    tenant: Optional[str] = None


class UnitRead(UnitBase):
    id: int