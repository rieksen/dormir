import os
import time

from dotenv import load_dotenv
from sqlalchemy import inspect, text
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
    from models_room import Room, Bed  # noqa: F401
    from models_student import Student  # noqa: F401
    from models_booking import Booking  # noqa: F401
    from models_payment import Payment  # noqa: F401
    from services_hostel import seed_rooms_and_beds

    SQLModel.metadata.create_all(engine)
    ensure_hostel_schema_compatibility()
    with Session(engine) as session:
        seed_rooms_and_beds(session)


def get_session():
    with Session(engine) as session:
        yield session


def ensure_hostel_schema_compatibility() -> None:
    """Add hostel columns that create_all cannot add to existing tables."""
    inspector = inspect(engine)
    if not inspector.has_table("room"):
        return

    def columns_for(table_name: str) -> dict[str, dict]:
        if not inspector.has_table(table_name):
            return {}
        return {column["name"]: column for column in inspector.get_columns(table_name)}

    def has_column(table_name: str, column_name: str) -> bool:
        return column_name in table_columns.get(table_name, {})

    def is_required(table_name: str, column_name: str) -> bool:
        column = table_columns.get(table_name, {}).get(column_name)
        return bool(column and not column.get("nullable", True))

    table_columns = {
        "room": columns_for("room"),
        "bed": columns_for("bed"),
        "student": columns_for("student"),
        "booking": columns_for("booking"),
        "payment": columns_for("payment"),
    }

    has_bed_table = inspector.has_table("bed")

    with engine.begin() as conn:
        if engine.dialect.name == "postgresql":
            conn.execute(text("""
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'roomgender') THEN
                    CREATE TYPE roomgender AS ENUM ('male', 'female', 'unassigned');
                END IF;
            END
            $$;
            """))
            conn.execute(text("ALTER TYPE bookingstatus ADD VALUE IF NOT EXISTS 'active'"))
            conn.execute(text("ALTER TYPE bookingstatus ADD VALUE IF NOT EXISTS 'checked_out'"))

            for column_name in ("campus_id", "room_type", "status"):
                if is_required("room", column_name):
                    conn.execute(text(f"ALTER TABLE room ALTER COLUMN {column_name} DROP NOT NULL"))

            if has_bed_table and is_required("bed", "label"):
                conn.execute(text("ALTER TABLE bed ALTER COLUMN label DROP NOT NULL"))

            for column_name in ("student_number", "first_name", "last_name", "school"):
                if is_required("student", column_name):
                    conn.execute(text(f"ALTER TABLE student ALTER COLUMN {column_name} DROP NOT NULL"))

            for column_name in ("room_id", "period_id", "amount_paid", "paid_on"):
                if is_required("booking", column_name):
                    conn.execute(text(f"ALTER TABLE booking ALTER COLUMN {column_name} DROP NOT NULL"))

            for column_name in ("fee_id", "amount_paid", "paid_on", "method"):
                if is_required("payment", column_name):
                    conn.execute(text(f"ALTER TABLE payment ALTER COLUMN {column_name} DROP NOT NULL"))

            if not has_column("room", "gender"):
                conn.execute(text("ALTER TABLE room ADD COLUMN gender roomgender NOT NULL DEFAULT 'unassigned'"))

            if has_bed_table and not has_column("bed", "bed_number"):
                conn.execute(text("ALTER TABLE bed ADD COLUMN bed_number INTEGER"))
            if has_bed_table and not has_column("bed", "is_occupied"):
                conn.execute(text("ALTER TABLE bed ADD COLUMN is_occupied BOOLEAN NOT NULL DEFAULT false"))
            if has_bed_table:
                conn.execute(text("""
                WITH numbered AS (
                    SELECT id, row_number() OVER (PARTITION BY room_id ORDER BY id) AS bed_order
                    FROM bed
                    WHERE bed_number IS NULL
                )
                UPDATE bed
                SET bed_number = numbered.bed_order
                FROM numbered
                WHERE bed.id = numbered.id
                """))

            if not has_column("student", "full_name"):
                conn.execute(text("ALTER TABLE student ADD COLUMN full_name VARCHAR"))
            if not has_column("student", "emergency_contact"):
                conn.execute(text("ALTER TABLE student ADD COLUMN emergency_contact VARCHAR"))
            if not has_column("student", "university"):
                conn.execute(text("ALTER TABLE student ADD COLUMN university VARCHAR"))
            if not has_column("student", "course_duration"):
                conn.execute(text("ALTER TABLE student ADD COLUMN course_duration INTEGER"))
            if not has_column("student", "semester_joined"):
                conn.execute(text("ALTER TABLE student ADD COLUMN semester_joined semester"))
            if not has_column("student", "year_joined"):
                conn.execute(text("ALTER TABLE student ADD COLUMN year_joined INTEGER"))

            if not has_column("booking", "bed_id"):
                conn.execute(text("ALTER TABLE booking ADD COLUMN bed_id INTEGER"))
            if not has_column("booking", "semester"):
                conn.execute(text("ALTER TABLE booking ADD COLUMN semester semester"))
            if not has_column("booking", "year"):
                conn.execute(text("ALTER TABLE booking ADD COLUMN year INTEGER"))

            if not has_column("payment", "booking_id"):
                conn.execute(text("ALTER TABLE payment ADD COLUMN booking_id INTEGER"))
            if not has_column("payment", "amount"):
                conn.execute(text("ALTER TABLE payment ADD COLUMN amount INTEGER"))
            if not has_column("payment", "status"):
                conn.execute(text("ALTER TABLE payment ADD COLUMN status paymentstatus"))
            if not has_column("payment", "confirmed_at"):
                conn.execute(text("ALTER TABLE payment ADD COLUMN confirmed_at TIMESTAMP"))
            return

        if not has_column("room", "gender"):
            conn.execute(text("ALTER TABLE room ADD COLUMN gender VARCHAR NOT NULL DEFAULT 'unassigned'"))
        if has_bed_table and not has_column("bed", "bed_number"):
            conn.execute(text("ALTER TABLE bed ADD COLUMN bed_number INTEGER"))
        if has_bed_table and not has_column("bed", "is_occupied"):
            conn.execute(text("ALTER TABLE bed ADD COLUMN is_occupied BOOLEAN NOT NULL DEFAULT 0"))
        if has_bed_table:
            conn.execute(text("UPDATE bed SET bed_number = id WHERE bed_number IS NULL"))
