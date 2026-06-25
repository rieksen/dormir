"""Tests for dashboard summary endpoint."""
import pytest
from fastapi.testclient import TestClient

from src.app.models import Unit
from src.app.models_payment import Payment
from src.app.models_lease import Lease
from src.app.models_maintenance import MaintenanceRequest


@pytest.fixture
def seeded_client(client: TestClient, session):
    session.add(Unit(number="101", floor=1, bedrooms=1, bathrooms=1, rent=1800, status="Occupied", tenant="A"))
    session.add(Unit(number="102", floor=1, bedrooms=1, bathrooms=1, rent=1800, status="Vacant"))
    session.add(Payment(tenant="James", unit="302", amount=2000, due="May 1, 2024", status="Overdue"))
    session.add(Payment(tenant="Sarah", unit="101", amount=1800, due="Jun 1, 2024", paid="Jun 1, 2024", status="Paid"))
    session.add(Lease(tenant="Priya", unit="201", start="Jun 1, 2023", end="May 31, 2024", rent=2600, status="Expiring Soon"))
    session.add(MaintenanceRequest(
        unit_id=1, tenant_id=1, category="HVAC", priority="High", status="Open",
        description="No heat", submitted_date="Jun 10, 2024",
    ))
    session.commit()
    return client


def test_dashboard_summary_returns_200(seeded_client: TestClient):
    response = seeded_client.get("/dashboard/summary")
    assert response.status_code == 200


def test_dashboard_summary_aggregates_counts(seeded_client: TestClient):
    data = seeded_client.get("/dashboard/summary").json()
    assert data["units"]["total"] == 2
    assert data["units"]["occupied"] == 1
    assert data["units"]["vacant"] == 1
    assert data["payments"]["collected"] == 1800
    assert data["leases"]["expiring"] == 1
    assert data["badges"]["payments"] == "1"
    assert data["badges"]["maintenance"] == "1"
    assert data["alert_count"] == 3


def test_dashboard_summary_includes_alerts(seeded_client: TestClient):
    data = seeded_client.get("/dashboard/summary").json()
    assert len(data["alerts"]) == 3
    types = {a["type"] for a in data["alerts"]}
    assert "overdue_payment" in types
    assert "lease_expiring" in types
    assert "maintenance" in types
