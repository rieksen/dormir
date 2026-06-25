from typing import Optional
from sqlmodel import Field, SQLModel


class LeaseBase(SQLModel):
    tenant: str
    unit: str
    start: str                          # "Jan 15, 2024"
    end: str                            # "Jan 14, 2025"
    rent: int                           # UGX per month
    status: str = Field(default="Active")  # Active | Expiring Soon | Expired
    notes: Optional[str] = Field(default=None)


class Lease(LeaseBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)


class LeaseCreate(LeaseBase):
    pass


class LeaseUpdate(SQLModel):
    tenant: Optional[str] = None
    unit: Optional[str] = None
    start: Optional[str] = None
    end: Optional[str] = None
    rent: Optional[int] = None
    status: Optional[str] = None
    notes: Optional[str] = None


class LeaseRead(LeaseBase):
    id: int