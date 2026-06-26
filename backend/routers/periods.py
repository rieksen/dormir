from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from database import get_session
from models_period import AcademicPeriod, AcademicPeriodCreate, AcademicPeriodRead, AcademicPeriodUpdate

router = APIRouter()

@router.get("/", response_model=list[AcademicPeriodRead])
def list_periods(session: Session = Depends(get_session)):
    return session.exec(select(AcademicPeriod)).all()

@router.get("/{period_id}", response_model=AcademicPeriodRead)
def get_period(period_id: int, session: Session = Depends(get_session)):
    period = session.get(AcademicPeriod, period_id)
    if not period:
        raise HTTPException(status_code=404, detail="Period not found")
    return period

@router.post("/", response_model=AcademicPeriodRead, status_code=201)
def create_period(data: AcademicPeriodCreate, session: Session = Depends(get_session)):
    # only one active period at a time
    if data.is_active:
        active = session.exec(select(AcademicPeriod).where(AcademicPeriod.is_active == True)).first()
        if active:
            raise HTTPException(status_code=400, detail=f"Period '{active.name}' is already active")
    period = AcademicPeriod.model_validate(data)
    session.add(period)
    session.commit()
    session.refresh(period)
    return period

@router.patch("/{period_id}", response_model=AcademicPeriodRead)
def update_period(period_id: int, data: AcademicPeriodUpdate, session: Session = Depends(get_session)):
    period = session.get(AcademicPeriod, period_id)
    if not period:
        raise HTTPException(status_code=404, detail="Period not found")
    if data.is_active:
        active = session.exec(select(AcademicPeriod).where(AcademicPeriod.is_active == True)).first()
        if active and active.id != period_id:
            raise HTTPException(status_code=400, detail=f"Period '{active.name}' is already active")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(period, field, value)
    session.add(period)
    session.commit()
    session.refresh(period)
    return period

@router.delete("/{period_id}", status_code=204)
def delete_period(period_id: int, session: Session = Depends(get_session)):
    period = session.get(AcademicPeriod, period_id)
    if not period:
        raise HTTPException(status_code=404, detail="Period not found")
    session.delete(period)
    session.commit()