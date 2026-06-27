# Main Campus Room Data

## Summary Statistics
- **Total Rooms**: 68
- **Single Rooms**: 47 (1 bed each)
- **Double Rooms**: 21 (2 beds each)
- **Total Beds**: 89
- **Price Range**: 650,000 - 1,300,000 UGX per bed

## Room Breakdown

### Singles (47 rooms, 47 beds)
R02, R05, R06, R7A, R7B, R10, R11, R12, R13, R14, R16, R17, R18, R19A, R19B, R22, R23, R24, R25, R26, R27, R28, R29, R40, R41, R42, R45, R46, R47, R48, R49, R50, R51, R52, R54, R55, R56, R57, R58, R59, R60, R61, R62, R63, R64, R65, R66

### Doubles (21 rooms, 42 beds)
R01, R03, R04, R08, R09, R15, R20, R21, R30, R31, R32, R33, R34, R35, R36, R37, R38, R39, R43, R44, R53

## Price Distribution

### 650,000 UGX (2 rooms)
- R01 (Double), R7A (Single)

### 700,000 UGX (1 room)
- R35 (Double)

### 750,000 UGX (2 rooms)
- R09 (Double), R36 (Double)

### 800,000 UGX (18 rooms)
- R03, R04, R05, R06, R08, R14, R15, R20, R21, R30, R31, R32, R33, R34, R38, R39, R40, R43, R44, R45, R48

### 850,000 UGX (8 rooms)
- R7B, R17, R18, R19B, R22, R23, R24, R25, R37

### 900,000 UGX (21 rooms)
- R02, R10, R11, R12, R16, R26, R27, R28, R29, R49, R50, R51, R54, R55, R58, R59, R60, R61, R62, R63, R64

### 1,000,000 UGX (3 rooms)
- R13, R65, R66

### 1,100,000 UGX (7 rooms)
- R19A, R41, R42, R46, R47, R52, R57

### 1,300,000 UGX (1 room)
- R56 (Highest priced room)

## Special Room Numbers
- **R7A, R7B**: Split room (no R07)
- **R19A, R19B**: Split room (no R19)

## Database Schema
All rooms are stored with:
- `room_number`: Unique identifier (e.g., "R01", "R7A")
- `gender`: Enum (Male, Female, Unassigned) - starts as Unassigned
- `price_per_bed`: Integer (price in UGX)
- `id`: Auto-generated primary key

All beds are stored with:
- `room_id`: Foreign key to room
- `bed_number`: Integer (1 for singles, 1-2 for doubles)
- `is_occupied`: Boolean - starts as False
- `id`: Auto-generated primary key

## Re-seeding Instructions
To re-seed the database (idempotent):
```bash
cd backend
source .venv/bin/activate
python seed_main_campus_rooms.py
```

The script will skip existing rooms and beds, only creating missing ones.
