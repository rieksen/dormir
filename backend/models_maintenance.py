from enum import Enum
from typing import Optional
from sqlmodel import Field, SQLModel


class MaintenanceCategory(str, Enum):
    plumbing = "Plumbing"
    electrical = "Electrical"
    hvac = "HVAC"
    appliance = "Appliance"
    other = "Other"


class MaintenancePriority(str, Enum):
    low = "Low"
    medium = "Medium"
    high = "High"
    emergency = "Emergency"


class MaintenanceStatus(str, Enum):
    open = "Open"
    in_progress = "In Progress"
    resolved = "Resolved"


class MaintenanceRequestBase(SQLModel):
    unit_id: int = Field(foreign_key="room.id")
    tenant_id: int = Field(foreign_key="student.id")
    category: MaintenanceCategory
    priority: MaintenancePriority
    status: MaintenanceStatus = Field(default=MaintenanceStatus.open)
    description: str
    submitted_date: str
    resolved_date: Optional[str] = None
    assigned_to: Optional[str] = None


class MaintenanceRequest(MaintenanceRequestBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)


class MaintenanceRequestCreate(SQLModel):
    unit_id: int
    tenant_id: int
    category: MaintenanceCategory
    priority: MaintenancePriority
    description: str
    assigned_to: Optional[str] = None


class MaintenanceRequestUpdate(SQLModel):
    unit_id: Optional[int] = None
    tenant_id: Optional[int] = None
    category: Optional[MaintenanceCategory] = None
    priority: Optional[MaintenancePriority] = None
    status: Optional[MaintenanceStatus] = None
    description: Optional[str] = None
    resolved_date: Optional[str] = None
    assigned_to: Optional[str] = None


class MaintenanceRequestRead(MaintenanceRequestBase):
    id: int
