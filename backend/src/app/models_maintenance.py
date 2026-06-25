from typing import Optional
from sqlmodel import Field, SQLModel


class MaintenanceRequestBase(SQLModel):
    unit_id: int
    tenant_id: int
    category: str                      # "Plumbing" | "Electrical" | "HVAC" | "Appliance" | "Other"
    priority: str                      # "Low" | "Medium" | "High" | "Emergency"
    status: str = Field(default="Open")  # "Open" | "In Progress" | "Resolved"
    description: str
    submitted_date: str
    resolved_date: Optional[str] = Field(default=None)
    assigned_to: Optional[str] = Field(default=None)


class MaintenanceRequest(MaintenanceRequestBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)


class MaintenanceRequestCreate(SQLModel):
    unit_id: int
    tenant_id: int
    category: str
    priority: str
    description: str
    assigned_to: Optional[str] = Field(default=None)


class MaintenanceRequestUpdate(SQLModel):
    unit_id: Optional[int] = None
    tenant_id: Optional[int] = None
    category: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    description: Optional[str] = None
    resolved_date: Optional[str] = None
    assigned_to: Optional[str] = None


class MaintenanceRequestRead(MaintenanceRequestBase):
    id: int
