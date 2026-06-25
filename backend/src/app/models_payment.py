from typing import Optional
from sqlmodel import Field, SQLModel


class PaymentBase(SQLModel):
    tenant: str
    unit: str
    amount: int                        # UGX
    due: str                           # "Jun 1, 2024"
    paid: Optional[str] = Field(default=None)   # None = not paid yet
    status: str = Field(default="Pending")      # Paid | Pending | Overdue
    notes: Optional[str] = Field(default=None)


class Payment(PaymentBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)


class PaymentCreate(PaymentBase):
    pass


class PaymentUpdate(SQLModel):
    tenant: Optional[str] = None
    unit: Optional[str] = None
    amount: Optional[int] = None
    due: Optional[str] = None
    paid: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None


class PaymentRead(PaymentBase):
    id: int
