from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from database import get_session
from models_campus import Campus, CampusCreate, CampusRead, CampusUpdate

router = APIRouter()

@router.get("/", response_model=list[CampusRead])
def list_campuses(session: Session = Depends(get_session)):
    return session.exec(select(Campus)).all()

@router.get("/{campus_id}", response_model=CampusRead)
def get_campus(campus_id: int, session: Session = Depends(get_session)):
    campus = session.get(Campus, campus_id)
    if not campus:
        raise HTTPException(status_code=404, detail="Campus not found")
    return campus

@router.post("/", response_model=CampusRead, status_code=201)
def create_campus(data: CampusCreate, session: Session = Depends(get_session)):
    campus = Campus.model_validate(data)
    session.add(campus)
    session.commit()
    session.refresh(campus)
    return campus

@router.patch("/{campus_id}", response_model=CampusRead)
def update_campus(campus_id: int, data: CampusUpdate, session: Session = Depends(get_session)):
    campus = session.get(Campus, campus_id)
    if not campus:
        raise HTTPException(status_code=404, detail="Campus not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(campus, field, value)
    session.add(campus)
    session.commit()
    session.refresh(campus)
    return campus

@router.delete("/{campus_id}", status_code=204)
def delete_campus(campus_id: int, session: Session = Depends(get_session)):
    campus = session.get(Campus, campus_id)
    if not campus:
        raise HTTPException(status_code=404, detail="Campus not found")
    session.delete(campus)
    session.commit()