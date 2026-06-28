from datetime import datetime, timezone
from sqlmodel import Session, select

from database import engine, create_db_and_tables
from models_room import Room, Bed, RoomGender
from models_student import Student, Gender, Semester
from models_booking import Booking, BookingStatus
from models_maintenance import (
    MaintenanceRequest,
    MaintenanceCategory,
    MaintenancePriority,
    MaintenanceStatus,
)


def seed_data() -> None:
    # Ensure tables exist
    create_db_and_tables()

    with Session(engine) as session:
        # Check if rooms exist (should exist from seed_rooms_and_beds in create_db_and_tables)
        rooms = session.exec(select(Room)).all()
        if not rooms:
            print("❌ No rooms found. Please seed rooms first.")
            return

        # Seed students if none exist
        students = session.exec(select(Student)).all()
        if not students:
            print("🌱 Seeding sample students...")
            students = [
                Student(
                    full_name="Alice Nansubuga",
                    phone="+256770000001",
                    emergency_contact="Jane Nansubuga (+256770000002)",
                    university="Makerere University",
                    course="BSc Software Engineering",
                    year_of_study=2,
                    course_duration=4,
                    gender=Gender.female,
                    semester_joined=Semester.sem1,
                    year_joined=2024,
                ),
                Student(
                    full_name="Bob Otieno",
                    phone="+256770000003",
                    emergency_contact="John Otieno (+256770000004)",
                    university="Kyambogo University",
                    course="BSc Civil Engineering",
                    year_of_study=1,
                    course_duration=4,
                    gender=Gender.male,
                    semester_joined=Semester.sem1,
                    year_joined=2025,
                ),
                Student(
                    full_name="Clara Kemigisha",
                    phone="+256770000005",
                    emergency_contact="Mary Kemigisha (+256770000006)",
                    university="Makerere University",
                    course="Bachelor of Medicine",
                    year_of_study=3,
                    course_duration=5,
                    gender=Gender.female,
                    semester_joined=Semester.sem1,
                    year_joined=2023,
                ),
                Student(
                    full_name="David Okello",
                    phone="+256770000007",
                    emergency_contact="Peter Okello (+256770000008)",
                    university="Makerere University",
                    course="Bachelor of Commerce",
                    year_of_study=2,
                    course_duration=3,
                    gender=Gender.male,
                    semester_joined=Semester.sem2,
                    year_joined=2024,
                ),
            ]
            for s in students:
                session.add(s)
            session.flush()

            # Create bookings for these students on empty beds
            print("🌱 Creating active bookings for students...")
            for idx, student in enumerate(students):
                # Find a bed in a room that matches the student's gender or is unassigned
                student_room_gender = RoomGender.male if student.gender == Gender.male else RoomGender.female
                
                # Query rooms compatible with this student's gender
                compatible_rooms = session.exec(
                    select(Room).where(Room.gender.in_([RoomGender.unassigned, student_room_gender]))
                ).all()

                assigned = False
                for room in compatible_rooms:
                    # Find unoccupied bed in this room
                    bed = session.exec(
                        select(Bed)
                        .where(Bed.room_id == room.id)
                        .where(Bed.is_occupied == False)
                    ).first()

                    if bed:
                        # Occupy bed and set room gender if unassigned
                        bed.is_occupied = True
                        if room.gender == RoomGender.unassigned:
                            room.gender = student_room_gender
                        
                        booking = Booking(
                            student_id=student.id,
                            bed_id=bed.id,
                            semester=Semester.sem1,
                            year=2026,
                            status=BookingStatus.active,
                        )
                        session.add(bed)
                        session.add(room)
                        session.add(booking)
                        assigned = True
                        break
                
                if not assigned:
                    print(f"⚠️ Could not assign bed to {student.full_name}")

            session.commit()
            # Refetch all students
            students = session.exec(select(Student)).all()

        # Seed maintenance requests if none exist
        requests = session.exec(select(MaintenanceRequest)).all()
        if not requests:
            print("🌱 Seeding maintenance requests...")
            
            # Map students to rooms for clean referencing
            student_bookings = []
            for s in students:
                b = session.exec(select(Booking).where(Booking.student_id == s.id).where(Booking.status == BookingStatus.active)).first()
                if b:
                    bed = session.get(Bed, b.bed_id)
                    student_bookings.append((s.id, bed.room_id))
            
            if not student_bookings:
                print("❌ No active student bookings found to link requests.")
                return

            # Seed requests
            sample_requests = [
                MaintenanceRequest(
                    unit_id=student_bookings[0][1],
                    tenant_id=student_bookings[0][0],
                    category=MaintenanceCategory.plumbing,
                    priority=MaintenancePriority.high,
                    status=MaintenanceStatus.open,
                    description="Kitchen sink is leaking under the cabinet, water pooling on the floor.",
                    submitted_date=(datetime.now(timezone.utc)).isoformat(),
                    assigned_to=None,
                ),
                MaintenanceRequest(
                    unit_id=student_bookings[0][1],
                    tenant_id=student_bookings[0][0],
                    category=MaintenanceCategory.electrical,
                    priority=MaintenancePriority.emergency,
                    status=MaintenanceStatus.in_progress,
                    description="Sparking wall socket in the bedroom near the desk.",
                    submitted_date=(datetime.now(timezone.utc)).isoformat(),
                    assigned_to="Mike Electrician",
                ),
                MaintenanceRequest(
                    unit_id=student_bookings[1][1],
                    tenant_id=student_bookings[1][0],
                    category=MaintenanceCategory.hvac,
                    priority=MaintenancePriority.medium,
                    status=MaintenanceStatus.resolved,
                    description="AC unit is blowing warm air instead of cold.",
                    submitted_date=(datetime.now(timezone.utc)).isoformat(),
                    resolved_date=(datetime.now(timezone.utc)).isoformat(),
                    assigned_to="Dave HVAC",
                ),
                MaintenanceRequest(
                    unit_id=student_bookings[2][1],
                    tenant_id=student_bookings[2][0],
                    category=MaintenanceCategory.appliance,
                    priority=MaintenancePriority.low,
                    status=MaintenanceStatus.open,
                    description="Microwave door latch is sticking, needs force to close.",
                    submitted_date=(datetime.now(timezone.utc)).isoformat(),
                    assigned_to=None,
                ),
                MaintenanceRequest(
                    unit_id=student_bookings[3][1],
                    tenant_id=student_bookings[3][0],
                    category=MaintenanceCategory.other,
                    priority=MaintenancePriority.medium,
                    status=MaintenanceStatus.open,
                    description="Front door lock cylinder is loose and key is hard to turn.",
                    submitted_date=(datetime.now(timezone.utc)).isoformat(),
                    assigned_to=None,
                ),
                MaintenanceRequest(
                    unit_id=student_bookings[0][1],
                    tenant_id=student_bookings[0][0],
                    category=MaintenanceCategory.plumbing,
                    priority=MaintenancePriority.medium,
                    status=MaintenanceStatus.in_progress,
                    description="Shower head has low pressure and drips constantly when turned off.",
                    submitted_date=(datetime.now(timezone.utc)).isoformat(),
                    assigned_to="Sarah Plumber",
                ),
                MaintenanceRequest(
                    unit_id=student_bookings[1][1],
                    tenant_id=student_bookings[1][0],
                    category=MaintenanceCategory.electrical,
                    priority=MaintenancePriority.low,
                    status=MaintenanceStatus.resolved,
                    description="Desk lamp bulb replacement needed.",
                    submitted_date=(datetime.now(timezone.utc)).isoformat(),
                    resolved_date=(datetime.now(timezone.utc)).isoformat(),
                    assigned_to="Mike Electrician",
                ),
                MaintenanceRequest(
                    unit_id=student_bookings[2][1],
                    tenant_id=student_bookings[2][0],
                    category=MaintenanceCategory.hvac,
                    priority=MaintenancePriority.high,
                    status=MaintenanceStatus.open,
                    description="Heater making loud grinding noise when starting up.",
                    submitted_date=(datetime.now(timezone.utc)).isoformat(),
                    assigned_to=None,
                ),
            ]

            for r in sample_requests:
                session.add(r)
            session.commit()
            print(f"✅ Successfully seeded {len(sample_requests)} maintenance requests.")
        else:
            print(f"ℹ️ Database already has {len(requests)} maintenance requests.")


if __name__ == "__main__":
    seed_data()
