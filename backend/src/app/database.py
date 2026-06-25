from sqlmodel import SQLModel, create_engine, Session

DATABASE_URL = "sqlite:///./aptv16.db"

engine = create_engine(DATABASE_URL, echo=False)


def create_db_and_tables():
    # Import all models here so SQLModel registers their tables
    from .models import Unit  # noqa: F401
    from .models_tenant import Tenant  # noqa: F401
    from .models_payment import Payment  # noqa: F401
    from .models_lease import Lease  # noqa: F401
    from .models_maintenance import MaintenanceRequest  # noqa: F401
    SQLModel.metadata.create_all(engine)


def get_session():
    with Session(engine) as session:
        yield session