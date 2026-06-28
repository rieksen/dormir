import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine
from sqlmodel.pool import StaticPool

from main import app
from database import get_session
from models_room import Room
from models_student import Student, Gender, Semester
from models_maintenance import (
    MaintenanceRequest,
    MaintenanceCategory,
    MaintenancePriority,
    MaintenanceStatus,
)

# Setup in-memory SQLite database for testing
DATABASE_URL = "sqlite://"
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)


@pytest.fixture(name="session")
def session_fixture():
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        yield session
    SQLModel.metadata.drop_all(engine)


@pytest.fixture(name="client")
def client_fixture(session: Session):
    def get_session_override():
        return session

    app.dependency_overrides[get_session_override] = get_session  # override database.py get_session if needed
    app.dependency_overrides[get_session] = get_session_override
    client = TestClient(app)
    yield client
    app.dependency_overrides.clear()


@pytest.fixture(name="seed_data")
def seed_data_fixture(session: Session):
    # Seed one room and one student
    room = Room(room_number="R01", price_per_bed=800000)
    student = Student(
        full_name="Alice Test",
        phone="12345",
        emergency_contact="54321",
        university="Test Univ",
        course="Testing",
        year_of_study=1,
        course_duration=3,
        gender=Gender.female,
        semester_joined=Semester.sem1,
        year_joined=2026,
    )
    session.add(room)
    session.add(student)
    session.commit()
    session.refresh(room)
    session.refresh(student)
    return {"room_id": room.id, "student_id": student.id}


def test_create_request(client: TestClient, seed_data):
    response = client.post(
        "/maintenance/",
        json={
            "unit_id": seed_data["room_id"],
            "tenant_id": seed_data["student_id"],
            "category": "Plumbing",
            "priority": "High",
            "description": "Leaky faucet",
            "assigned_to": "John Carpenter",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["id"] is not None
    assert data["unit_id"] == seed_data["room_id"]
    assert data["tenant_id"] == seed_data["student_id"]
    assert data["category"] == "Plumbing"
    assert data["priority"] == "High"
    assert data["status"] == "Open"
    assert data["description"] == "Leaky faucet"
    assert data["submitted_date"] is not None
    assert data["resolved_date"] is None
    assert data["assigned_to"] == "John Carpenter"


def test_create_request_validation(client: TestClient, seed_data):
    # Invalid category
    response = client.post(
        "/maintenance/",
        json={
            "unit_id": seed_data["room_id"],
            "tenant_id": seed_data["student_id"],
            "category": "InvalidCategory",
            "priority": "High",
            "description": "Leaky faucet",
        },
    )
    assert response.status_code == 422

    # Non-existent room (unit)
    response = client.post(
        "/maintenance/",
        json={
            "unit_id": 9999,
            "tenant_id": seed_data["student_id"],
            "category": "Plumbing",
            "priority": "High",
            "description": "Leaky faucet",
        },
    )
    assert response.status_code == 400
    assert response.json()["detail"] == "Room not found"

    # Non-existent student (tenant)
    response = client.post(
        "/maintenance/",
        json={
            "unit_id": seed_data["room_id"],
            "tenant_id": 9999,
            "category": "Plumbing",
            "priority": "High",
            "description": "Leaky faucet",
        },
    )
    assert response.status_code == 400
    assert response.json()["detail"] == "Student not found"


def test_list_requests(client: TestClient, session: Session, seed_data):
    # Add requests directly to DB
    req1 = MaintenanceRequest(
        unit_id=seed_data["room_id"],
        tenant_id=seed_data["student_id"],
        category=MaintenanceCategory.plumbing,
        priority=MaintenancePriority.medium,
        status=MaintenanceStatus.open,
        description="Leak",
        submitted_date="2026-06-28T12:00:00",
    )
    req2 = MaintenanceRequest(
        unit_id=seed_data["room_id"],
        tenant_id=seed_data["student_id"],
        category=MaintenanceCategory.electrical,
        priority=MaintenancePriority.low,
        status=MaintenanceStatus.resolved,
        description="Bulb",
        submitted_date="2026-06-28T12:30:00",
    )
    session.add(req1)
    session.add(req2)
    session.commit()

    response = client.get("/maintenance/")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    assert data[0]["description"] == "Leak"
    assert data[1]["description"] == "Bulb"


def test_get_request(client: TestClient, session: Session, seed_data):
    req = MaintenanceRequest(
        unit_id=seed_data["room_id"],
        tenant_id=seed_data["student_id"],
        category=MaintenanceCategory.hvac,
        priority=MaintenancePriority.emergency,
        status=MaintenanceStatus.in_progress,
        description="No heat",
        submitted_date="2026-06-28T12:00:00",
    )
    session.add(req)
    session.commit()
    session.refresh(req)

    response = client.get(f"/maintenance/{req.id}")
    assert response.status_code == 200
    assert response.json()["description"] == "No heat"

    response = client.get("/maintenance/9999")
    assert response.status_code == 404
    assert response.json()["detail"] == "Maintenance request not found"


def test_patch_request(client: TestClient, session: Session, seed_data):
    req = MaintenanceRequest(
        unit_id=seed_data["room_id"],
        tenant_id=seed_data["student_id"],
        category=MaintenanceCategory.appliance,
        priority=MaintenancePriority.low,
        status=MaintenanceStatus.open,
        description="Squeaky fridge door",
        submitted_date="2026-06-28T12:00:00",
    )
    session.add(req)
    session.commit()
    session.refresh(req)

    # Partial update: change priority and assigned_to
    response = client.patch(
        f"/maintenance/{req.id}",
        json={"priority": "Medium", "assigned_to": "Bob Fixer"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["priority"] == "Medium"
    assert data["assigned_to"] == "Bob Fixer"
    assert data["status"] == "Open"
    assert data["resolved_date"] is None

    # Change status to Resolved (should auto-populate resolved_date)
    response = client.patch(
        f"/maintenance/{req.id}",
        json={"status": "Resolved"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "Resolved"
    assert data["resolved_date"] is not None


def test_delete_request(client: TestClient, session: Session, seed_data):
    req = MaintenanceRequest(
        unit_id=seed_data["room_id"],
        tenant_id=seed_data["student_id"],
        category=MaintenanceCategory.other,
        priority=MaintenancePriority.medium,
        status=MaintenanceStatus.open,
        description="Loose doorknob",
        submitted_date="2026-06-28T12:00:00",
    )
    session.add(req)
    session.commit()
    session.refresh(req)

    # Delete existing
    response = client.delete(f"/maintenance/{req.id}")
    assert response.status_code == 204

    # Delete non-existent
    response = client.delete("/maintenance/9999")
    assert response.status_code == 404
    assert response.json()["detail"] == "Maintenance request not found"


def test_summary(client: TestClient, session: Session, seed_data):
    # Add various requests
    requests = [
        MaintenanceRequest(
            unit_id=seed_data["room_id"],
            tenant_id=seed_data["student_id"],
            category=MaintenanceCategory.plumbing,
            priority=MaintenancePriority.emergency,
            status=MaintenanceStatus.open,
            description="Emergency plumbing",
            submitted_date="2026-06-28T12:00:00",
        ),
        MaintenanceRequest(
            unit_id=seed_data["room_id"],
            tenant_id=seed_data["student_id"],
            category=MaintenanceCategory.electrical,
            priority=MaintenancePriority.high,
            status=MaintenanceStatus.in_progress,
            description="High electrical",
            submitted_date="2026-06-28T12:00:00",
        ),
        MaintenanceRequest(
            unit_id=seed_data["room_id"],
            tenant_id=seed_data["student_id"],
            category=MaintenanceCategory.hvac,
            priority=MaintenancePriority.low,
            status=MaintenanceStatus.resolved,
            description="Low hvac",
            submitted_date="2026-06-28T12:00:00",
        ),
    ]
    for r in requests:
        session.add(r)
    session.commit()

    response = client.get("/maintenance/summary")
    assert response.status_code == 200
    data = response.json()
    assert data["by_status"] == {"Open": 1, "In Progress": 1, "Resolved": 1}
    assert data["by_priority"] == {"Low": 1, "Medium": 0, "High": 1, "Emergency": 1}
