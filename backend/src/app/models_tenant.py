from typing import Optional
from sqlmodel import Field, SQLModel


class TenantBase(SQLModel):
    name: str
    email: str
    phone: str
    unit: str                          # unit number string, e.g. "101"
    lease_status: str = Field(default="Active")  # Active | Expiring | Expired
    move_in: str                       # stored as "Jan 15, 2024" to match UI


class Tenant(TenantBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)


class TenantCreate(TenantBase):
    pass


class TenantUpdate(SQLModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    unit: Optional[str] = None
    lease_status: Optional[str] = None
    move_in: Optional[str] = None


class TenantRead(TenantBase):
    id: int

    @property
    def initials(self) -> str:
        return "".join(p[0] for p in self.name.split())
