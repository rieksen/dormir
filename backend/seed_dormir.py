"""
Seed script for Dormir API - Creates sample data for testing
Run with: uv run python seed_dormir.py
"""

from datetime import date, timedelta
from sqlmodel import Session, select
from database import engine, create_db_and_tables
from models_campus import Campus
from models_room import Room, Bed, RoomType, RoomStatus
from models_student import Student, Gender
from models_period import AcademicPeriod
from models_booking import Booking, BookingStatus
from models_allocation import Allocation, AllocationStatus
from models_fee import Fee
from models_payment import Payment

def clear_all_data(session: Session):
    """Clear existing data (for clean testing)"""
    print("🗑️  Clearing existing data...")
    # Delete in reverse order of dependencies
    session.query(Payment).delete()
    session.query(Fee).delete()
    session.query(Allocation).delete()
    session.query(Booking).delete()
    session.query(Bed).delete()
    session.query(Room).delete()
    session.query(Student).delete()
    session.query(AcademicPeriod).delete()
    session.query(Campus).delete()
    session.commit()
    print("✅ Data cleared")

def seed_campuses(session: Session) -> list[Campus]:
    """Create sample campuses"""
    print("\n🏛️  Creating campuses...")
    campuses = [
        Campus(name="Main Campus", location="Kampala, Uganda"),
        Campus(name="East Wing", location="Nakawa, Kampala"),
        Campus(name="Makerere Hostel", location="Wandegeya, Kampala"),
    ]
    for campus in campuses:
        session.add(campus)
    session.commit()
    for campus in campuses:
        session.refresh(campus)
    print(f"✅ Created {len(campuses)} campuses")
    return campuses

def seed_periods(session: Session) -> list[AcademicPeriod]:
    """Create academic periods"""
    print("\n📅 Creating academic periods...")
    today = date.today()
    periods = [
        AcademicPeriod(
            name="Semester 1 2024/2025",
            start_date=today - timedelta(days=30),
            end_date=today + timedelta(days=120),
            is_active=True
        ),
        AcademicPeriod(
            name="Semester 2 2024/2025",
            start_date=today + timedelta(days=150),
            end_date=today + timedelta(days=300),
            is_active=False
        ),
    ]
    for period in periods:
        session.add(period)
    session.commit()
    for period in periods:
        session.refresh(period)
    print(f"✅ Created {len(periods)} periods")
    return periods

def seed_rooms(session: Session, campuses: list[Campus]) -> list[Room]:
    """Create sample rooms with beds"""
    print("\n🏠 Creating rooms...")
    rooms = []
    
    # Main Campus - Mix of single and double rooms
    for floor in [1, 2, 3]:
        for num in range(1, 6):  # 5 rooms per floor
            room_num = f"{floor}0{num}"
            room_type = RoomType.double if num <= 3 else RoomType.single
            price = 500000 if room_type == RoomType.double else 800000
            
            room = Room(
                campus_id=campuses[0].id,
                room_number=room_num,
                room_type=room_type,
                price_per_bed=price,
                floor=floor,
                status=RoomStatus.available
            )
            session.add(room)
            session.flush()  # Get the room ID
            
            # Create beds
            bed_labels = ["A", "B"] if room_type == RoomType.double else ["A"]
            for label in bed_labels:
                bed = Bed(room_id=room.id, label=label)
                session.add(bed)
            
            rooms.append(room)
    
    # East Wing - Mostly doubles
    for num in range(1, 11):  # 10 rooms
        room = Room(
            campus_id=campuses[1].id,
            room_number=f"E{num:02d}",
            room_type=RoomType.double,
            price_per_bed=450000,
            floor=1 if num <= 5 else 2,
            status=RoomStatus.available
        )
        session.add(room)
        session.flush()
        
        for label in ["A", "B"]:
            bed = Bed(room_id=room.id, label=label)
            session.add(bed)
        
        rooms.append(room)
    
    # Makerere Hostel - Budget singles
    for num in range(1, 8):  # 7 rooms
        room = Room(
            campus_id=campuses[2].id,
            room_number=f"M{num}",
            room_type=RoomType.single,
            price_per_bed=350000,
            floor=1,
            status=RoomStatus.available
        )
        session.add(room)
        session.flush()
        
        bed = Bed(room_id=room.id, label="A")
        session.add(bed)
        
        rooms.append(room)
    
    session.commit()
    print(f"✅ Created {len(rooms)} rooms with beds")
    return rooms

def seed_students(session: Session) -> list[Student]:
    """Create sample students"""
    print("\n👨‍🎓 Creating students...")
    
    students_data = [
        # Male students
        ("M2024001", "James", "Okello", Gender.male, "+256701234567", "james.okello@students.mak.ac.ug", "Makerere University", "Computer Science", 2),
        ("M2024002", "David", "Musoke", Gender.male, "+256702345678", "david.musoke@students.mak.ac.ug", "Makerere University", "Electrical Engineering", 3),
        ("M2024003", "Peter", "Ssemakula", Gender.male, "+256703456789", "peter.ssemakula@students.mak.ac.ug", "Kyambogo University", "Business Administration", 1),
        ("M2024004", "John", "Mwesigwa", Gender.male, "+256704567890", None, "Uganda Christian University", "Law", 2),
        ("M2024005", "Andrew", "Kato", Gender.male, "+256705678901", "andrew.kato@students.mak.ac.ug", "Makerere University", "Medicine", 4),
        
        # Female students
        ("F2024001", "Sarah", "Namugga", Gender.female, "+256706789012", "sarah.namugga@students.mak.ac.ug", "Makerere University", "Computer Science", 2),
        ("F2024002", "Grace", "Nakato", Gender.female, "+256707890123", "grace.nakato@students.mak.ac.ug", "Makerere University", "Architecture", 3),
        ("F2024003", "Betty", "Akello", Gender.female, "+256708901234", None, "Kyambogo University", "Education", 1),
        ("F2024004", "Martha", "Nabirye", Gender.female, "+256709012345", "martha.nabirye@students.mak.ac.ug", "Uganda Christian University", "Mass Communication", 2),
        ("F2024005", "Linda", "Kemigisha", Gender.female, "+256700123456", "linda.kemigisha@students.mak.ac.ug", "Makerere University", "Social Work", 3),
    ]
    
    students = []
    for data in students_data:
        student = Student(
            student_number=data[0],
            first_name=data[1],
            last_name=data[2],
            gender=data[3],
            phone=data[4],
            email=data[5],
            school=data[6],
            course=data[7],
            year_of_study=data[8]
        )
        session.add(student)
        students.append(student)
    
    session.commit()
    for student in students:
        session.refresh(student)
    
    print(f"✅ Created {len(students)} students")
    return students

def seed_bookings_and_allocations(
    session: Session,
    students: list[Student],
    rooms: list[Room],
    period: AcademicPeriod
):
    """Create sample bookings and allocations"""
    print("\n📝 Creating bookings and allocations...")
    
    # Get available beds
    beds = session.exec(select(Bed)).all()
    bed_map = {}
    for bed in beds:
        if bed.room_id not in bed_map:
            bed_map[bed.room_id] = []
        bed_map[bed.room_id].append(bed)
    
    bookings_created = 0
    allocations_created = 0
    
    # Create confirmed bookings with allocations for first 6 students
    for i, student in enumerate(students[:6]):
        # Find suitable room based on gender
        suitable_rooms = [r for r in rooms[:15] if r.status == RoomStatus.available]
        if not suitable_rooms:
            break
            
        room = suitable_rooms[i % len(suitable_rooms)]
        
        # Create booking
        booking = Booking(
            student_id=student.id,
            room_id=room.id,
            period_id=period.id,
            amount_paid=100000,  # Booking fee
            paid_on=date.today() - timedelta(days=20 - i),
            status=BookingStatus.confirmed
        )
        session.add(booking)
        session.flush()
        bookings_created += 1
        
        # Create allocation
        available_beds = bed_map.get(room.id, [])
        if available_beds:
            bed = available_beds[0]
            allocation = Allocation(
                booking_id=booking.id,
                bed_id=bed.id,
                student_id=student.id,
                period_id=period.id,
                allocated_on=date.today() - timedelta(days=15 - i),
                status=AllocationStatus.active
            )
            session.add(allocation)
            allocations_created += 1
            
            # Remove bed from available list
            bed_map[room.id].remove(bed)
            
            # Create fee (rent - booking fee)
            fee = Fee(
                student_id=student.id,
                allocation_id=allocation.id,
                period_id=period.id,
                amount_due=room.price_per_bed - 100000,
                due_date=date.today() + timedelta(days=30)  # Due in 30 days
            )
            session.add(fee)
            session.flush()
            
            # Create partial payment for some students
            if i % 2 == 0:
                payment = Payment(
                    fee_id=fee.id,
                    amount_paid=200000,
                    paid_on=date.today() - timedelta(days=10 - i),
                    method="mobile_money",
                    reference=f"MM{student.student_number}"
                )
                session.add(payment)
    
    # Create pending bookings for remaining students
    for i, student in enumerate(students[6:], start=6):
        suitable_rooms = [r for r in rooms[15:22] if r.status == RoomStatus.available]
        if not suitable_rooms:
            break
            
        room = suitable_rooms[i % len(suitable_rooms)]
        
        booking = Booking(
            student_id=student.id,
            room_id=room.id,
            period_id=period.id,
            amount_paid=100000,
            paid_on=date.today() - timedelta(days=5),
            status=BookingStatus.pending
        )
        session.add(booking)
        bookings_created += 1
    
    session.commit()
    print(f"✅ Created {bookings_created} bookings and {allocations_created} allocations")

def main():
    """Main seed function"""
    print("🌱 Starting Dormir API seed process...\n")
    
    # Create tables
    create_db_and_tables()
    
    with Session(engine) as session:
        # Clear existing data
        clear_all_data(session)
        
        # Seed in order
        campuses = seed_campuses(session)
        periods = seed_periods(session)
        rooms = seed_rooms(session, campuses)
        students = seed_students(session)
        
        # Use active period
        active_period = next(p for p in periods if p.is_active)
        seed_bookings_and_allocations(session, students, rooms, active_period)
    
    print("\n🎉 Seed completed successfully!")
    print("\n📊 Summary:")
    print(f"  - 3 Campuses")
    print(f"  - 2 Academic Periods (1 active)")
    print(f"  - {len(rooms)} Rooms with beds")
    print(f"  - 10 Students (5 male, 5 female)")
    print(f"  - 6 Confirmed bookings with allocations")
    print(f"  - 4 Pending bookings")
    print(f"  - Sample fees and payments")
    print("\n🚀 Ready to test the application!")

if __name__ == "__main__":
    main()
