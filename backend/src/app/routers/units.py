from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from ..database import get_session
from ..models import Unit, UnitCreate, UnitRead, UnitUpdate

router = APIRouter()


@router.get("/", response_model=list[UnitRead])
def list_units(session: Session = Depends(get_session)):
    return session.exec(select(Unit)).all()


@router.get("/{unit_id}", response_model=UnitRead)
def get_unit(unit_id: int, session: Session = Depends(get_session)):
    unit = session.get(Unit, unit_id)
    if not unit:
        raise HTTPException(status_code=404, detail="Unit not found")
    return unit


@router.post("/", response_model=UnitRead, status_code=201)
def create_unit(data: UnitCreate, session: Session = Depends(get_session)):
    unit = Unit.model_validate(data)
    session.add(unit)
    session.commit()
    session.refresh(unit)
    return unit


@router.patch("/{unit_id}", response_model=UnitRead)
def update_unit(unit_id: int, data: UnitUpdate, session: Session = Depends(get_session)):
    unit = session.get(Unit, unit_id)
    if not unit:
        raise HTTPException(status_code=404, detail="Unit not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(unit, field, value)
    session.add(unit)
    session.commit()
    session.refresh(unit)
    return unit


@router.delete("/{unit_id}", status_code=204)
def delete_unit(unit_id: int, session: Session = Depends(get_session)):
    unit = session.get(Unit, unit_id)
    if not unit:
        raise HTTPException(status_code=404, detail="Unit not found")
    session.delete(unit)
    session.commit()