from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select
from ..database import get_session
from ..models_payment import Payment, PaymentCreate, PaymentRead, PaymentUpdate

router = APIRouter()


@router.get("/", response_model=list[PaymentRead])
def list_payments(
    status: str | None = Query(default=None),
    session: Session = Depends(get_session),
):
    q = select(Payment)
    if status:
        q = q.where(Payment.status == status)
    return session.exec(q).all()


@router.get("/summary")
def payment_summary(session: Session = Depends(get_session)):
    payments = session.exec(select(Payment)).all()
    collected   = sum(p.amount for p in payments if p.status == "Paid")
    pending     = sum(p.amount for p in payments if p.status == "Pending")
    overdue     = sum(p.amount for p in payments if p.status == "Overdue")
    return {"collected": collected, "pending": pending, "overdue": overdue}


@router.get("/{payment_id}", response_model=PaymentRead)
def get_payment(payment_id: int, session: Session = Depends(get_session)):
    payment = session.get(Payment, payment_id)
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    return payment


@router.post("/", response_model=PaymentRead, status_code=201)
def create_payment(data: PaymentCreate, session: Session = Depends(get_session)):
    payment = Payment.model_validate(data)
    session.add(payment)
    session.commit()
    session.refresh(payment)
    return payment


@router.patch("/{payment_id}", response_model=PaymentRead)
def update_payment(payment_id: int, data: PaymentUpdate, session: Session = Depends(get_session)):
    payment = session.get(Payment, payment_id)
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(payment, field, value)
    session.add(payment)
    session.commit()
    session.refresh(payment)
    return payment


@router.delete("/{payment_id}", status_code=204)
def delete_payment(payment_id: int, session: Session = Depends(get_session)):
    payment = session.get(Payment, payment_id)
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    session.delete(payment)
    session.commit()
