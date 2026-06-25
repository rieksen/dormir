from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from ..database import get_session
from ..models_tenant import Tenant, TenantCreate, TenantRead, TenantUpdate

router = APIRouter()


@router.get("/", response_model=list[TenantRead])
def list_tenants(session: Session = Depends(get_session)):
    return session.exec(select(Tenant)).all()


@router.get("/{tenant_id}", response_model=TenantRead)
def get_tenant(tenant_id: int, session: Session = Depends(get_session)):
    tenant = session.get(Tenant, tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    return tenant


@router.post("/", response_model=TenantRead, status_code=201)
def create_tenant(data: TenantCreate, session: Session = Depends(get_session)):
    tenant = Tenant.model_validate(data)
    session.add(tenant)
    session.commit()
    session.refresh(tenant)
    return tenant


@router.patch("/{tenant_id}", response_model=TenantRead)
def update_tenant(tenant_id: int, data: TenantUpdate, session: Session = Depends(get_session)):
    tenant = session.get(Tenant, tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(tenant, field, value)
    session.add(tenant)
    session.commit()
    session.refresh(tenant)
    return tenant


@router.delete("/{tenant_id}", status_code=204)
def delete_tenant(tenant_id: int, session: Session = Depends(get_session)):
    tenant = session.get(Tenant, tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    session.delete(tenant)
    session.commit()
