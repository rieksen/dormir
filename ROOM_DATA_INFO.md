# Main Campus Room Data

## Status: ✅ Already Configured

The room data you provided is already configured in the codebase!

## Location

The room data is defined in:
- **File**: `/backend/services_hostel.py`
- **Constant**: `ROOM_SEED_DATA`
- **Usage**: `HOSTEL_ROOM_NUMBERS`

## Room Summary

- **Total Rooms**: 66 rooms
- **Singles**: 45 rooms (1 bed each)
- **Doubles**: 21 rooms (2 beds each)
- **Total Capacity**: 87 beds
- **Price Range**: 
  - Minimum: UGX 650,000 (R01, 07A)
  - Maximum: UGX 1,300,000 (R56)
  - Average: ~UGX 890,000

## Room Types Breakdown

### Singles (45 rooms - 45 beds)
R02, R05, R06, 07A, 07B, R10, R11, R12, R13, R14, R16, R17, R18, R19A, R19B, R22, R23, R24, R25, R26, R27, R28, R29, R40, R41, R42, R45, R46, R47, R48, R49, R50, R51, R52, R54, R55, R56, R57, R58, R59, R60, R61, R62, R63, R64, R65, R66

### Doubles (21 rooms - 42 beds)
R01, R03, R04, R08, R09, R15, R20, R21, R30, R31, R32, R33, R34, R35, R36, R37, R38, R39, R43, R44, R53

## Price Tiers

### Budget (< UGX 700,000)
- R01: 650,000
- 07A: 650,000

### Standard (UGX 700,000 - 900,000)
- Most rooms fall in this range
- Singles: 800,000 - 900,000
- Doubles: 700,000 - 850,000

### Premium (> UGX 1,000,000)
- R13: 1,000,000
- R19A: 1,100,000
- R41, R42, R46, R47, R52, R57: 1,100,000
- R65, R66: 1,000,000
- R56: 1,300,000 (highest)

## How to Seed the Database

### Option 1: Automatic (Recommended)
The rooms are seeded automatically when you start the FastAPI server:

```bash
cd backend
source .venv/bin/activate
python -m uvicorn main:app --reload
```

The `create_db_and_tables()` function in `main.py` automatically seeds the rooms.

### Option 2: Manual Seeding
Run the seed script directly:

```bash
cd backend
source .venv/bin/activate
python seed_dormir.py
```

### Option 3: Use the Custom Script
I created a detailed seed script for you:

```bash
cd backend
source .venv/bin/activate
python seed_main_campus_rooms.py
```

## Database Requirements

The current configuration uses **PostgreSQL**:
- Database: `dormir`
- User: `dormir`
- Password: `dormir`
- Host: `localhost`
- Port: `5432`

### To Use SQLite Instead

If you don't have PostgreSQL installed, update `.env`:

```env
DATABASE_URL=sqlite:///./dormir.db
CORS_ORIGINS=http://localhost:5173
DEBUG=true
```

## Room Numbering Scheme

- Standard rooms: R01-R66
- Split rooms: 07A/07B, R19A/R19B (same floor, different entrances)
- All rooms are on Floor 1 (Main Campus)

## Integration with UI

The rooms appear in:
1. **Dashboard** - Total beds, occupancy statistics
2. **Rooms Page** - Full list with occupancy status
3. **Register Page** - Available beds dropdown (filtered by gender)
4. **Reports Page** - Occupancy breakdown by room
5. **Rollover Page** - Semester transition management

## Next Steps

1. ✅ Room data is already in the code
2. 🔄 Set up PostgreSQL database OR switch to SQLite
3. 🔄 Run the seeding script
4. 🔄 Start the backend server
5. ✅ Frontend is already configured and running

Your hostel management system is ready with all 66 rooms configured!
