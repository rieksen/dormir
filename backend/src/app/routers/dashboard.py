from datetime import datetime

from fastapi import APIRouter, Depends
from sqlmodel import Session, select

from ..database import get_session
from ..models import Unit
from ..models_lease import Lease
from ..models_maintenance import MaintenanceRequest
from ..models_payment import Payment
from ..models_tenant import Tenant

router = APIRouter()


def _parse_date(s: str) -> datetime | None:
    try:
        return datetime.strptime(s, "%b %d, %Y")
    except ValueError:
        return None


@router.get("/summary")
def dashboard_summary(session: Session = Depends(get_session)):
    """Aggregate dashboard KPIs, alerts, and entity lists in one response."""
    units = session.exec(select(Unit)).all()
    payments = session.exec(select(Payment)).all()
    leases = session.exec(select(Lease)).all()
    maintenance = session.exec(select(MaintenanceRequest)).all()
    tenants = session.exec(select(Tenant)).all()

    unit_map = {u.id: u.number for u in units}

    occupied = sum(1 for u in units if u.status == "Occupied")
    vacant = sum(1 for u in units if u.status == "Vacant")
    in_maint = sum(1 for u in units if u.status == "Maintenance")

    collected = sum(p.amount for p in payments if p.status == "Paid")
    pending = sum(p.amount for p in payments if p.status == "Pending")
    overdue_amt = sum(p.amount for p in payments if p.status == "Overdue")

    by_status = {"Open": 0, "In Progress": 0, "Resolved": 0}
    by_priority = {"Low": 0, "Medium": 0, "High": 0, "Emergency": 0}
    for req in maintenance:
        if req.status in by_status:
            by_status[req.status] += 1
        if req.priority in by_priority:
            by_priority[req.priority] += 1

    overdue_count = sum(1 for p in payments if p.status == "Overdue")
    open_maint = by_status["Open"] + by_status["In Progress"]
    expiring_count = sum(1 for l in leases if l.status == "Expiring Soon")

    alerts: list[dict] = []

    for p in payments:
        if p.status != "Overdue":
            continue
        d = _parse_date(p.due)
        alerts.append({
            "type": "overdue_payment",
            "title": "Payment overdue",
            "detail": f"{p.tenant} · Unit {p.unit}",
            "page": "payments",
            "date": p.due,
            "_sort": d.timestamp() if d else 0,
        })

    for lease in leases:
        if lease.status != "Expiring Soon":
            continue
        d = _parse_date(lease.end)
        alerts.append({
            "type": "lease_expiring",
            "title": "Lease expiring soon",
            "detail": f"{lease.tenant} · Unit {lease.unit}",
            "page": "leases",
            "date": lease.end,
            "_sort": d.timestamp() if d else 0,
        })

    for req in maintenance:
        if req.status not in ("Open", "In Progress"):
            continue
        d = _parse_date(req.submitted_date)
        unit_num = unit_map.get(req.unit_id, str(req.unit_id))
        alerts.append({
            "type": "maintenance",
            "title": "Maintenance request",
            "detail": f"{req.category} · Unit {unit_num}",
            "page": "maintenance",
            "date": req.submitted_date,
            "priority": req.priority,
            "_sort": d.timestamp() if d else 0,
        })

    alerts.sort(key=lambda a: a["_sort"], reverse=True)
    for alert in alerts:
        del alert["_sort"]

    badges: dict[str, str | None] = {
        "payments": str(overdue_count) if overdue_count else None,
        "maintenance": str(open_maint) if open_maint else None,
    }

    return {
        "units": {
            "total": len(units),
            "occupied": occupied,
            "vacant": vacant,
            "maintenance": in_maint,
            "items": [{"id": u.id, "number": u.number, "status": u.status} for u in units],
        },
        "payments": {
            "collected": collected,
            "pending": pending,
            "overdue": overdue_amt,
            "items": [p.model_dump() for p in payments],
        },
        "leases": {
            "active": sum(1 for l in leases if l.status == "Active"),
            "expiring": expiring_count,
            "expired": sum(1 for l in leases if l.status == "Expired"),
            "items": [l.model_dump() for l in leases],
        },
        "maintenance": {
            "by_status": by_status,
            "by_priority": by_priority,
            "items": [m.model_dump() for m in maintenance],
        },
        "tenants": [t.model_dump() for t in tenants],
        "alerts": alerts[:10],
        "alert_count": overdue_count + expiring_count + open_maint,
        "badges": badges,
    }
