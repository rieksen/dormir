import os
import time

from dotenv import load_dotenv
from sqlalchemy import text
from sqlmodel import SQLModel, Session, create_engine

load_dotenv()

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+psycopg2://dormir:dormir@localhost:5432/dormir",
)
DEBUG = os.getenv("DEBUG", "false").lower() in ("1", "true", "yes")

engine = create_engine(
    DATABASE_URL,
    echo=DEBUG,
    pool_pre_ping=True,
)


def wait_for_db(max_retries: int = 30, delay: float = 2.0) -> None:
    """Wait until PostgreSQL is reachable (used on Docker startup)."""
    for attempt in range(max_retries):
        try:
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            return
        except Exception:
            if attempt == max_retries - 1:
                raise
            time.sleep(delay)


def create_db_and_tables() -> None:
    wait_for_db()
    from models_campus import Campus  # noqa: F401
    from models_room import Room, Bed  # noqa: F401
    from models_period import AcademicPeriod  # noqa: F401
    from models_student import Student  # noqa: F401
    from models_booking import Booking  # noqa: F401
    from models_allocation import Allocation  # noqa: F401
    from models_fee import Fee  # noqa: F401
    from models_payment import Payment  # noqa: F401

    SQLModel.metadata.create_all(engine)


def get_session():
    with Session(engine) as session:
        yield session
