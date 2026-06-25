"""Seed maintenance_request table."""
from .database import create_db_and_tables, engine
from .models_maintenance import MaintenanceRequest
from sqlmodel import Session

MAINTENANCE_REQUESTS = [
    # Emergency - Plumbing - Open
    {
        "unit_id": 1, "tenant_id": 1, "category": "Plumbing", "priority": "Emergency",
        "status": "Open", "description": "Burst pipe in bathroom, water flooding floor",
        "submitted_date": "Jun 10, 2024", "resolved_date": None, "assigned_to": None
    },
    # High - Electrical - In Progress
    {
        "unit_id": 3, "tenant_id": 3, "category": "Electrical", "priority": "High",
        "status": "In Progress", "description": "Multiple outlets not working in living room",
        "submitted_date": "Jun 8, 2024", "resolved_date": None, "assigned_to": "Mike Johnson"
    },
    # Medium - HVAC - Resolved
    {
        "unit_id": 2, "tenant_id": 2, "category": "HVAC", "priority": "Medium",
        "status": "Resolved", "description": "Air conditioner making loud noise",
        "submitted_date": "Jun 1, 2024", "resolved_date": "Jun 5, 2024", "assigned_to": "Sarah Williams"
    },
    # Low - Appliance - Open
    {
        "unit_id": 5, "tenant_id": 5, "category": "Appliance", "priority": "Low",
        "status": "Open", "description": "Refrigerator light bulb needs replacement",
        "submitted_date": "Jun 9, 2024", "resolved_date": None, "assigned_to": None
    },
    # High - Other - In Progress
    {
        "unit_id": 7, "tenant_id": 7, "category": "Other", "priority": "High",
        "status": "In Progress", "description": "Front door lock mechanism jammed, cannot secure unit",
        "submitted_date": "Jun 7, 2024", "resolved_date": None, "assigned_to": "Mike Johnson"
    },
    # Emergency - Electrical - Resolved
    {
        "unit_id": 4, "tenant_id": 4, "category": "Electrical", "priority": "Emergency",
        "status": "Resolved", "description": "Circuit breaker keeps tripping, power outage",
        "submitted_date": "Jun 3, 2024", "resolved_date": "Jun 3, 2024", "assigned_to": "Mike Johnson"
    },
    # Medium - Plumbing - Resolved
    {
        "unit_id": 6, "tenant_id": 6, "category": "Plumbing", "priority": "Medium",
        "status": "Resolved", "description": "Kitchen sink drains slowly",
        "submitted_date": "May 28, 2024", "resolved_date": "Jun 2, 2024", "assigned_to": "Sarah Williams"
    },
    # Low - HVAC - Open
    {
        "unit_id": 8, "tenant_id": 8, "category": "HVAC", "priority": "Low",
        "status": "Open", "description": "Thermostat display not showing temperature",
        "submitted_date": "Jun 11, 2024", "resolved_date": None, "assigned_to": "Sarah Williams"
    },
    # High - Appliance - Resolved
    {
        "unit_id": 1, "tenant_id": 1, "category": "Appliance", "priority": "High",
        "status": "Resolved", "description": "Dishwasher leaking water onto floor",
        "submitted_date": "May 25, 2024", "resolved_date": "May 27, 2024", "assigned_to": "Mike Johnson"
    },
    # Medium - Other - In Progress
    {
        "unit_id": 3, "tenant_id": 3, "category": "Other", "priority": "Medium",
        "status": "In Progress", "description": "Window screen torn and needs replacement",
        "submitted_date": "Jun 6, 2024", "resolved_date": None, "assigned_to": None
    },
]

if __name__ == "__main__":
    create_db_and_tables()
    with Session(engine) as session:
        for req in MAINTENANCE_REQUESTS:
            session.add(MaintenanceRequest(**req))
        session.commit()
    print(f"Seeded {len(MAINTENANCE_REQUESTS)} maintenance requests.")
