from typing import Optional
from sqlmodel import Field, SQLModel
from datetime import date
from enum import Enum

class PaymentMethod(str, Enum):
    cash = "cash"
    mobile_money = "mobile_money"
    bank = "bank"

class PaymentBase(SQLModel):
    fee_id: int = Field(foreign_key="fee.id")
    amount_paid: int
    paid_on: date
    method: PaymentMethod
    reference: Optional[str] = None

class Payment(PaymentBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)

class PaymentCreate(PaymentBase):
    pass

class PaymentUpdate(SQLModel):
    amount_paid: Optional[int] = None
    paid_on: Optional[date] = None
    method: Optional[PaymentMethod] = None
    reference: Optional[str] = None

class PaymentRead(PaymentBase):
    id: int