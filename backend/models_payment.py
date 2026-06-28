from datetime import datetime
from enum import Enum
from typing import Optional

from sqlmodel import Field, SQLModel


class PaymentStatus(str, Enum):
    pending = "pending"
    confirmed = "confirmed"


class PaymentType(str, Enum):
    booking = "booking"
    full_payment = "full_payment"


class PaymentBase(SQLModel):
    booking_id: int = Field(foreign_key="booking.id")
    amount: int
    status: PaymentStatus = PaymentStatus.pending
    payment_type: Optional[PaymentType] = None
    confirmed_at: Optional[datetime] = None


class Payment(PaymentBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)


class PaymentUpdate(SQLModel):
    status: Optional[PaymentStatus] = None
    confirmed_at: Optional[datetime] = None


class PaymentRead(PaymentBase):
    id: int
