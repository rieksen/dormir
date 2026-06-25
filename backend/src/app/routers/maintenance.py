from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select, func
from datetime import datetime
from ..database import get_session
from ..models_maintenance import (
    MaintenanceRequest,
    MaintenanceRequestCreate,
    MaintenanceRequestRead,
    MaintenanceRequestUpdate,
)

router = APIRouter()


@router.get("/", response_model=list[MaintenanceRequestRead])
def list_maintenance_requests(session: Session = Depends(get_session)):
    """List all maintenance requests"""
    return session.exec(select(MaintenanceRequest)).all()


@router.get("/summary", response_model=dict)
def get_maintenance_summary(session: Session = Depends(get_session)):
    """Get maintenance request counts grouped by status and priority"""
    # Get all requests
    requests = session.exec(select(MaintenanceRequest)).all()

    # Initialize counters
    by_status = {"Open": 0, "In Progress": 0, "Resolved": 0}
    by_priority = {"Low": 0, "Medium": 0, "High": 0, "Emergency": 0}

    # Count by status and priority
    for request in requests:
        if request.status in by_status:
            by_status[request.status] += 1
        if request.priority in by_priority:
            by_priority[request.priority] += 1

    return {"by_status": by_status, "by_priority": by_priority}


@router.get("/{id}", response_model=MaintenanceRequestRead)
def get_maintenance_request(id: int, session: Session = Depends(get_session)):
    """Retrieve a single maintenance request by ID"""
    request = session.get(MaintenanceRequest, id)
    if not request:
        raise HTTPException(status_code=404, detail="Maintenance request not found")
    return request


@router.post("/", response_model=MaintenanceRequestRead, status_code=201)
def create_maintenance_request(
    data: MaintenanceRequestCreate, session: Session = Depends(get_session)
):
    """Create a new maintenance request"""
    # Validate category
    valid_categories = ["Plumbing", "Electrical", "HVAC", "Appliance", "Other"]
    if data.category not in valid_categories:
        raise HTTPException(
            status_code=422,
            detail=f"Invalid category. Must be one of: {', '.join(valid_categories)}",
        )

    # Validate priority
    valid_priorities = ["Low", "Medium", "High", "Emergency"]
    if data.priority not in valid_priorities:
        raise HTTPException(
            status_code=422,
            detail=f"Invalid priority. Must be one of: {', '.join(valid_priorities)}",
        )

    # Create request with automatic fields
    request_data = data.model_dump()
    request_data["submitted_date"] = datetime.now().isoformat()
    request_data["status"] = "Open"

    request = MaintenanceRequest.model_validate(request_data)
    session.add(request)
    session.commit()
    session.refresh(request)
    return request


@router.patch("/{id}", response_model=MaintenanceRequestRead)
def update_maintenance_request(
    id: int, data: MaintenanceRequestUpdate, session: Session = Depends(get_session)
):
    """Update a maintenance request (partial updates supported)"""
    request = session.get(MaintenanceRequest, id)
    if not request:
        raise HTTPException(status_code=404, detail="Maintenance request not found")

    # Get update data
    update_data = data.model_dump(exclude_unset=True)

    # Validate category if provided
    if "category" in update_data:
        valid_categories = ["Plumbing", "Electrical", "HVAC", "Appliance", "Other"]
        if update_data["category"] not in valid_categories:
            raise HTTPException(
                status_code=422,
                detail=f"Invalid category. Must be one of: {', '.join(valid_categories)}",
            )

    # Validate priority if provided
    if "priority" in update_data:
        valid_priorities = ["Low", "Medium", "High", "Emergency"]
        if update_data["priority"] not in valid_priorities:
            raise HTTPException(
                status_code=422,
                detail=f"Invalid priority. Must be one of: {', '.join(valid_priorities)}",
            )

    # Auto-set resolved_date when status changes to "Resolved"
    if "status" in update_data and update_data["status"] == "Resolved":
        if "resolved_date" not in update_data:
            update_data["resolved_date"] = datetime.now().isoformat()

    # Apply updates
    for field, value in update_data.items():
        setattr(request, field, value)

    session.add(request)
    session.commit()
    session.refresh(request)
    return request


@router.delete("/{id}", status_code=204)
def delete_maintenance_request(id: int, session: Session = Depends(get_session)):
    """Delete a maintenance request"""
    request = session.get(MaintenanceRequest, id)
    if not request:
        raise HTTPException(status_code=404, detail="Maintenance request not found")
    session.delete(request)
    session.commit()
