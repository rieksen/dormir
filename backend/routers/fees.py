from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from database import get_session
from models_fee import Fee, FeeCreate, FeeRead, FeeUpdate

router = APIRouter()

@router.get("/", response_model=list[FeeRead])
def list_fees(session: Session = Depends(get_session)):
    return session.exec(select(Fee)).all()

@router.get("/{fee_id}", response_model=FeeRead)
def get_fee(fee_id: int, session: Session = Depends(get_session)):
    fee = session.get(Fee, fee_id)
    if not fee:
        raise HTTPException(status_code=404, detail="Fee not found")
    return fee

@router.patch("/{fee_id}", response_model=FeeRead)
def update_fee(fee_id: int, data: FeeUpdate, session: Session = Depends(get_session)):
    fee = session.get(Fee, fee_id)
    if not fee:
        raise HTTPException(status_code=404, detail="Fee not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(fee, field, value)
    session.add(fee)
    session.commit()
    session.refresh(fee)
    return fee

@router.delete("/{fee_id}", status_code=204)
def delete_fee(fee_id: int, session: Session = Depends(get_session)):
    fee = session.get(Fee, fee_id)
    if not fee:
        raise HTTPException(status_code=404, detail="Fee not found")
    session.delete(fee)
    session.commit()