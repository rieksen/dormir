from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from ..database import get_session
from ..models_lease import Lease, LeaseCreate, LeaseRead, LeaseUpdate

router = APIRouter()


@router.get("/", response_model=list[LeaseRead])
def list_leases(session: Session = Depends(get_session)):
    return session.exec(select(Lease)).all()


@router.get("/summary")
def lease_summary(session: Session = Depends(get_session)):
    leases = session.exec(select(Lease)).all()
    return {
        "active":       sum(1 for l in leases if l.status == "Active"),
        "expiring":     sum(1 for l in leases if l.status == "Expiring Soon"),
        "expired":      sum(1 for l in leases if l.status == "Expired"),
    }


@router.get("/{lease_id}", response_model=LeaseRead)
def get_lease(lease_id: int, session: Session = Depends(get_session)):
    lease = session.get(Lease, lease_id)
    if not lease:
        raise HTTPException(status_code=404, detail="Lease not found")
    return lease


@router.post("/", response_model=LeaseRead, status_code=201)
def create_lease(data: LeaseCreate, session: Session = Depends(get_session)):
    lease = Lease.model_validate(data)
    session.add(lease)
    session.commit()
    session.refresh(lease)
    return lease


@router.patch("/{lease_id}", response_model=LeaseRead)
def update_lease(lease_id: int, data: LeaseUpdate, session: Session = Depends(get_session)):
    lease = session.get(Lease, lease_id)
    if not lease:
        raise HTTPException(status_code=404, detail="Lease not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(lease, field, value)
    session.add(lease)
    session.commit()
    session.refresh(lease)
    return lease


@router.delete("/{lease_id}", status_code=204)
def delete_lease(lease_id: int, session: Session = Depends(get_session)):
    lease = session.get(Lease, lease_id)
    if not lease:
        raise HTTPException(status_code=404, detail="Lease not found")
    session.delete(lease)
    session.commit()