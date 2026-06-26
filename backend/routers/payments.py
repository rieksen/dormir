from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from database import get_session
from models_payment import Payment, PaymentCreate, PaymentRead, PaymentUpdate
from models_fee import Fee

router = APIRouter()

@router.get("/", response_model=list[PaymentRead])
def list_payments(session: Session = Depends(get_session)):
    return session.exec(select(Payment)).all()

@router.get("/{payment_id}", response_model=PaymentRead)
def get_payment(payment_id: int, session: Session = Depends(get_session)):
    payment = session.get(Payment, payment_id)
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    return payment

@router.post("/", response_model=PaymentRead, status_code=201)
def create_payment(data: PaymentCreate, session: Session = Depends(get_session)):
    fee = session.get(Fee, data.fee_id)
    if not fee:
        raise HTTPException(status_code=404, detail="Fee not found")

    # guard against overpayment
    existing_payments = session.exec(select(Payment).where(Payment.fee_id == data.fee_id)).all()
    total_paid = sum(p.amount_paid for p in existing_payments)
    if total_paid + data.amount_paid > fee.amount_due:
        raise HTTPException(status_code=400, detail=f"Overpayment — balance remaining is {fee.amount_due - total_paid} UGX")

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