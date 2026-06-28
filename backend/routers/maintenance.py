from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from database import get_session
from models_room import Room
from models_student import Student
from models_maintenance import (
    MaintenanceRequest,
    MaintenanceRequestCreate,
    MaintenanceRequestUpdate,
    MaintenanceRequestRead,
    MaintenanceStatus,
)

router = APIRouter()


@router.get("", response_model=list[MaintenanceRequestRead])
def list_requests(session: Session = Depends(get_session)):
    return session.exec(select(MaintenanceRequest).order_by(MaintenanceRequest.id)).all()


@router.get("/summary")
def get_summary(session: Session = Depends(get_session)):
    requests = session.exec(select(MaintenanceRequest)).all()
    by_status = {"Open": 0, "In Progress": 0, "Resolved": 0}
    by_priority = {"Low": 0, "Medium": 0, "High": 0, "Emergency": 0}

    for req in requests:
        # Get raw string representation of enums if needed
        status_val = req.status.value if hasattr(req.status, "value") else req.status
        if status_val in by_status:
            by_status[status_val] += 1
        
        priority_val = req.priority.value if hasattr(req.priority, "value") else req.priority
        if priority_val in by_priority:
            by_priority[priority_val] += 1

    return {
        "by_status": by_status,
        "by_priority": by_priority,
    }


@router.get("/{request_id}", response_model=MaintenanceRequestRead)
def get_request(request_id: int, session: Session = Depends(get_session)):
    req = session.get(MaintenanceRequest, request_id)
    if not req:
        raise HTTPException(status_code=404, detail="Maintenance request not found")
    return req


@router.post("", response_model=MaintenanceRequestRead, status_code=201)
def create_request(data: MaintenanceRequestCreate, session: Session = Depends(get_session)):
    room = session.get(Room, data.unit_id)
    if not room:
        raise HTTPException(status_code=400, detail="Room not found")
    student = session.get(Student, data.tenant_id)
    if not student:
        raise HTTPException(status_code=400, detail="Student not found")

    db_req = MaintenanceRequest(
        unit_id=data.unit_id,
        tenant_id=data.tenant_id,
        category=data.category,
        priority=data.priority,
        status=MaintenanceStatus.open,
        description=data.description,
        submitted_date=datetime.now(timezone.utc).isoformat(),
        assigned_to=data.assigned_to,
    )
    session.add(db_req)
    session.commit()
    session.refresh(db_req)
    return db_req


@router.patch("/{request_id}", response_model=MaintenanceRequestRead)
def update_request(request_id: int, data: MaintenanceRequestUpdate, session: Session = Depends(get_session)):
    db_req = session.get(MaintenanceRequest, request_id)
    if not db_req:
        raise HTTPException(status_code=404, detail="Maintenance request not found")

    update_dict = data.model_dump(exclude_unset=True)

    if "unit_id" in update_dict and update_dict["unit_id"] is not None:
        room = session.get(Room, update_dict["unit_id"])
        if not room:
            raise HTTPException(status_code=400, detail="Room not found")
            
    if "tenant_id" in update_dict and update_dict["tenant_id"] is not None:
        student = session.get(Student, update_dict["tenant_id"])
        if not student:
            raise HTTPException(status_code=400, detail="Student not found")

    old_status = db_req.status
    for key, value in update_dict.items():
        setattr(db_req, key, value)

    if db_req.status == MaintenanceStatus.resolved and old_status != MaintenanceStatus.resolved:
        if not db_req.resolved_date:
            db_req.resolved_date = datetime.now(timezone.utc).isoformat()

    session.add(db_req)
    session.commit()
    session.refresh(db_req)
    return db_req


@router.delete("/{request_id}", status_code=204)
def delete_request(request_id: int, session: Session = Depends(get_session)):
    db_req = session.get(MaintenanceRequest, request_id)
    if not db_req:
        raise HTTPException(status_code=404, detail="Maintenance request not found")
    session.delete(db_req)
    session.commit()
    return
