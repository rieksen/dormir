# 🚀 Quick Reference Card

## 📊 Project Status: 75% Complete ✅

| Component | Status |
|-----------|--------|
| Backend API | ✅ 100% |
| Frontend Pages | ✅ 100% |
| Seed Data | ✅ 100% |
| Authentication | ⏳ 0% |

---

## 🏃 Quick Start Commands

### Start Backend
```bash
cd backend
uv run uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

### Start Frontend
```bash
cd frontend
npm run dev
```

### Reseed Database
```bash
cd backend
uv run python seed_dormir.py
```

### Build Frontend
```bash
cd frontend
npm run build  # Should complete with 0 errors
```

---

## 🌐 URLs

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:8000 |
| API Docs | http://localhost:8000/docs |
| Health Check | http://localhost:8000/health |

---

## 📁 Key Files

### Backend
```
backend/
├── main.py                    # FastAPI app + router registration
├── database.py                # SQLModel setup
├── models_*.py                # Domain models (9 files)
├── routers/                   # API endpoints (9 files)
│   ├── students.py
│   ├── rooms.py
│   ├── bookings.py
│   ├── allocations.py
│   ├── fees.py              ✨ NEW
│   ├── payments.py
│   ├── campuses.py
│   ├── periods.py
│   └── dashboard.py
└── seed_dormir.py            # Test data generator
```

### Frontend
```
frontend/src/app/
├── App.tsx                    # Main app + routing
├── pages/                     # Page components (8 files)
│   ├── DashboardPage.tsx
│   ├── StudentsPage.tsx
│   ├── RoomsPage.tsx
│   ├── BookingsPage.tsx
│   ├── AllocationsPage.tsx
│   ├── PaymentsPage.tsx     ✨ REFACTORED
│   └── ...
├── lib/
│   ├── types.ts              # TypeScript definitions
│   ├── api.ts                # Base API client
│   └── api/                  # API client modules (9 files)
│       ├── students.ts
│       ├── rooms.ts
│       ├── bookings.ts
│       ├── allocations.ts
│       ├── fees.ts          ✨ NEW
│       ├── payments.ts      ✨ NEW
│       └── ...
└── components/ui/            # Shadcn components
```

---

## 🔌 API Endpoints

### Core Resources
```
GET    /students/              List all students
POST   /students/              Create student
GET    /students/{id}          Get student
PATCH  /students/{id}          Update student
DELETE /students/{id}          Delete student

GET    /rooms/                 List all rooms
POST   /rooms/                 Create room
GET    /rooms/{id}/beds        Get room beds

GET    /bookings/              List all bookings
POST   /bookings/              Create booking
PATCH  /bookings/{id}          Update booking status

GET    /allocations/           List all allocations
POST   /allocations/           Create allocation
PATCH  /allocations/{id}       Update allocation status

GET    /fees/                  List all fees        ✨ NEW
GET    /fees/{id}              Get fee

GET    /payments/              List all payments
POST   /payments/              Record payment       ✨ NEW
```

### Dashboard
```
GET    /dashboard/summary              KPIs
GET    /dashboard/occupancy            Per-campus occupancy
GET    /dashboard/recent-payments      Last 10 payments
GET    /dashboard/recent-bookings      Last 10 bookings
```

---

## 🎯 Complete Workflows

### 1. Add New Student → Allocation → Payment

```
Step 1: Add Student
  → Navigate to Students
  → Click "Add Student"
  → Fill form (name, gender, school, etc.)
  → Save

Step 2: Create Booking
  → Navigate to Bookings
  → Click "New Booking"
  → Select student, room, period
  → Enter booking fee payment
  → Save (status = "pending")

Step 3: Confirm Booking
  → Find booking in list
  → Click booking card
  → Click "Confirm Booking"
  → Status changes to "confirmed"

Step 4: Create Allocation
  → Navigate to Allocations
  → Click "New Allocation"
  → Select confirmed booking (auto-fills student & period)
  → Select available bed
  → Save
  → Fee auto-generates (amount = rent - booking fee)

Step 5: Record Payment
  → Navigate to Payments
  → Click "Record Payment"
  → Select fee from dropdown
  → Enter payment amount
  → Select payment method
  → Save
  → Balance updates
```

---

## 🧪 Test Data (from seed_dormir.py)

### Generated Data
```
📊 Seed Data Includes:
  - 3 Campuses (Main Campus, East Wing, Makerere Hostel)
  - 32 Rooms (mix of single & double)
  - 64 Beds (auto-generated)
  - 2 Academic Periods (1 active: Jan-Jun 2026)
  - 10 Students (5 male, 5 female)
  - 6 Confirmed bookings with allocations
  - 4 Pending bookings
  - 6 Fees (auto-generated from allocations)
  - 3 Sample payments
```

### Sample Students
```
Male Students:
1. John Doe (Computer Science, Year 1)
2. James Smith (Engineering, Year 2)
3. Michael Brown (Business, Year 1)
4. David Wilson (Medicine, Year 3)
5. Robert Taylor (Law, Year 2)

Female Students:
6. Sarah Johnson (Economics, Year 1)
7. Emily Davis (Nursing, Year 2)
8. Jessica Martinez (Education, Year 1)
9. Amanda Garcia (Pharmacy, Year 2)
10. Mary Rodriguez (Architecture, Year 1)
```

---

## 🐛 Troubleshooting

### "Cannot connect to backend"
```bash
# Check if backend is running
curl http://localhost:8000/health

# If not running, start it
cd backend
uv run uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

### "No data showing in frontend"
```bash
# Reseed database
cd backend
uv run python seed_dormir.py

# Refresh browser
```

### "TypeScript errors"
```bash
cd frontend
npm run build

# Should show 0 errors
# If errors exist, check console for details
```

### "Module not found errors"
```bash
# Reinstall dependencies
cd frontend
npm install

# Clear cache
rm -rf node_modules/.vite
npm run dev
```

---

## 📊 Key Metrics to Monitor

### Dashboard KPIs
- **Total Beds**: Should be 64 (from seed)
- **Occupied Beds**: Should be 6 (from allocations)
- **Occupancy Rate**: ~9.4% (6/64)
- **Pending Bookings**: Should be 4
- **Outstanding Balance**: Sum of unpaid fees

### Data Integrity
- Each room should have 1-2 beds (depending on type)
- Active allocations count = occupied beds count
- Fee balance = amount_due - sum(payments)
- No student assigned to 2 beds in same period

---

## 🎨 UI Component Reference

### Icons Used (lucide-react)
```
Users      - Students
Building   - Campuses
DoorOpen   - Rooms
Bed        - Beds
Calendar   - Bookings
Key        - Allocations
DollarSign - Payments
Receipt    - Fees
LayoutDashboard - Dashboard
```

### Color Scheme
```css
/* Status Colors */
Paid / Success:   emerald-600 (green)
Pending:          blue-600 (blue)
Outstanding:      red-600 (red)
Cancelled:        slate-400 (gray)
Maintenance:      amber-600 (yellow)

/* Backgrounds */
Cards:            white / slate-900 (dark)
Surface:          slate-50 / slate-800 (dark)
Border:           slate-200 / slate-700 (dark)
```

---

## 🔐 Authentication TODO (Task 5)

### Backend
```python
# models_user.py
class User:
    username: str
    hashed_password: str
    role: str  # "admin" | "staff" | "student"

# routers/auth.py
POST /auth/login    # Returns JWT token
POST /auth/logout   # Invalidates token
GET  /auth/me       # Get current user
```

### Frontend
```typescript
// AuthContext.tsx
interface AuthContext {
  user: User | null;
  login: (username, password) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

// Login flow
1. User enters credentials
2. POST /auth/login → receives JWT
3. Store token in localStorage
4. Set Authorization header on all requests
5. Redirect to dashboard
```

---

## 📚 Documentation Index

| Document | Purpose |
|----------|---------|
| `README.md` | Project overview |
| `FINAL_ENHANCEMENTS_STATUS.md` | Task completion status |
| `TASK_4_COMPLETE.md` | PaymentsPage technical docs |
| `PAYMENTS_PAGE_GUIDE.md` | PaymentsPage user guide |
| `SESSION_SUMMARY.md` | Session accomplishments |
| `QUICK_REFERENCE.md` | This file |
| `frontend/MIGRATION_SUMMARY.md` | Original migration docs |

---

## 🎯 Current Capabilities

✅ **What Works Now:**
- Complete student management
- Room & bed tracking with occupancy
- Booking workflow (pending → confirmed)
- Allocation management (bed assignments)
- Fee auto-generation on allocation
- Payment recording with balance tracking
- Dashboard with real-time KPIs
- Campus-based organization
- Academic period management
- Mobile-responsive UI
- Dark mode support

❌ **What's Missing:**
- User authentication
- Role-based permissions
- Audit logging
- Email notifications
- Report generation
- Data export (CSV/Excel)

---

## 💡 Pro Tips

### Development
1. Keep backend running in one terminal
2. Keep frontend running in another terminal
3. Use seed script to reset data anytime
4. Check browser console for errors
5. Use `/docs` endpoint to test API directly

### Testing
1. Always test with fresh seed data first
2. Test mobile view (Chrome DevTools)
3. Test dark mode toggle
4. Check all CRUD operations
5. Verify balance calculations manually

### Debugging
1. Check backend logs for API errors
2. Check browser console for frontend errors
3. Use Network tab to inspect API calls
4. Verify data in `/docs` endpoint
5. Test API with curl if frontend fails

---

**Last Updated:** June 26, 2026  
**Next Task:** Authentication System (Task 5)  
**Project Completion:** 75% ✅

---

*Need more details? See other documentation files in project root.*
