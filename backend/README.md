# Design Document: Maintenance Requests

## Overview

The Maintenance Requests feature provides a complete CRUD workflow for tracking and managing apartment maintenance issues in the APTv16 system. This feature integrates seamlessly with the existing FastAPI + SQLModel backend and React + TypeScript frontend, following established architectural patterns.

### Purpose

Enable property managers to:
- Submit new maintenance requests for apartment units
- Track request status throughout the resolution lifecycle
- Assign technicians to maintenance issues
- Filter and search requests by status, priority, and category
- View aggregate statistics for maintenance workload

### Scope

**In Scope:**
- Backend: RESTful API endpoints for maintenance request CRUD operations
- Backend: Summary endpoint for dashboard statistics
- Backend: SQLModel table definition and migrations
- Frontend: Full-featured maintenance requests page with forms and filtering
- Frontend: Status badge visualization with color coding
- Database seeding for development and testing

**Out of Scope:**
- Email notifications for request updates
- File upload for issue photos
- Technician scheduling/calendar integration
- Mobile-specific native applications
- Real-time updates via WebSocket

### Key Design Decisions

1. **Status as String Enum**: Using string values ("Open", "In Progress", "Resolved") rather than integer codes for clarity and API readability
2. **Automatic Timestamp Management**: `submitted_date` set on creation, `resolved_date` auto-set when status changes to "Resolved"
3. **Foreign Key Pattern**: Storing `unit_id` and `tenant_id` as integers to reference existing Units and Tenants tables
4. **Nullable Fields**: `assigned_to` and `resolved_date` are optional to support unassigned and unresolved requests
5. **Summary Endpoint**: Dedicated `/maintenance/summary` endpoint for dashboard statistics rather than client-side aggregation
6. **Filter-First UI**: Status filter tabs as primary navigation method, matching existing page patterns

---

## Architecture

### System Context

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│   React/Vite    │◄───────►│  FastAPI Backend │◄───────►│  SQLite (via    │
│   Frontend      │   HTTP  │   + SQLModel     │  SQL    │   SQLModel)     │
│   (TypeScript)  │  /JSON  │                  │         │                  │
└─────────────────┘         └──────────────────┘         └─────────────────┘
        │                            │
        │                            │
        ▼                            ▼
  MaintenancePage.tsx        routers/maintenance.py
  - List/Filter UI           - CRUD endpoints
  - Add/Edit Forms           - /maintenance/summary
  - Delete Confirm           - Request validation
  - Status Badges
```

### Integration Points


**Backend Integration:**
- `database.py`: Import `MaintenanceRequest` model in `create_db_and_tables()` to register table
- `main.py`: Register maintenance router with `app.include_router(maintenance.router, prefix="/maintenance", tags=["maintenance"])`
- References to existing `Unit` and `Tenant` tables via foreign key relationships

**Frontend Integration:**
- `App.tsx`: Import and route `MaintenancePage` component
- Uses existing shadcn/ui components (Dialog, Button, Badge, Tabs, etc.)
- Follows established API client pattern with `fetch` and error handling
- Matches existing page layouts (UnitsPage, TenantsPage, PaymentsPage)

### Data Flow

**Create Request Flow:**
1. User fills form in frontend modal → validates required fields
2. POST `/maintenance/` with JSON payload
3. Backend validates schema, sets `submitted_date`, initializes `status="Open"`
4. SQLModel creates record, returns with generated `id`
5. Frontend refreshes list, closes modal

**Update Request Flow:**
1. User edits request → changes status to "Resolved"
2. PATCH `/maintenance/{id}` with partial update
3. Backend applies changes, auto-sets `resolved_date` if status="Resolved"
4. Returns updated record
5. Frontend updates list item in place


**Summary Data Flow:**
1. Frontend loads page → fires GET `/maintenance/summary` alongside GET `/maintenance/`
2. Backend queries all requests, groups by status and priority
3. Returns JSON: `{"by_status": {"Open": 5, ...}, "by_priority": {"High": 3, ...}}`
4. Frontend displays counts in dashboard cards or filter tabs

---

## Components and Interfaces

### Backend Components

#### 1. Data Models (`models_maintenance.py`)

**MaintenanceRequestBase**
```python
class MaintenanceRequestBase(SQLModel):
    unit_id: int                           # FK to Unit.id
    tenant_id: int                         # FK to Tenant.id
    category: str                          # "Plumbing" | "Electrical" | "HVAC" | "Appliance" | "Other"
    priority: str                          # "Low" | "Medium" | "High" | "Emergency"
    status: str = Field(default="Open")    # "Open" | "In Progress" | "Resolved"
    description: str                       # Text description of the issue
    submitted_date: str                    # ISO date string or "MMM DD, YYYY"
    resolved_date: Optional[str] = None    # Set when status="Resolved"
    assigned_to: Optional[str] = None      # Technician name
```


**MaintenanceRequest (Table)**
```python
class MaintenanceRequest(MaintenanceRequestBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
```

**MaintenanceRequestCreate**
```python
class MaintenanceRequestCreate(MaintenanceRequestBase):
    # Inherits all required fields from base
    # submitted_date will be set by backend, not required in input
    pass
```

**MaintenanceRequestUpdate**
```python
class MaintenanceRequestUpdate(SQLModel):
    unit_id: Optional[int] = None
    tenant_id: Optional[int] = None
    category: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    description: Optional[str] = None
    resolved_date: Optional[str] = None
    assigned_to: Optional[str] = None
    # Note: submitted_date not updatable
```

**MaintenanceRequestRead**
```python
class MaintenanceRequestRead(MaintenanceRequestBase):
    id: int
```


#### 2. API Router (`routers/maintenance.py`)

**Endpoints:**

| Method | Path | Description | Status Codes |
|--------|------|-------------|--------------|
| GET | `/maintenance/` | List all requests | 200 |
| GET | `/maintenance/{id}` | Get single request | 200, 404 |
| POST | `/maintenance/` | Create request | 201, 422 |
| PATCH | `/maintenance/{id}` | Update request | 200, 404, 422 |
| DELETE | `/maintenance/{id}` | Delete request | 204, 404 |
| GET | `/maintenance/summary` | Get statistics | 200 |

**Endpoint Details:**

**POST `/maintenance/`**
- Input: `MaintenanceRequestCreate` (without `submitted_date`)
- Logic: Set `submitted_date` to current timestamp, ensure `status="Open"`
- Validation: Require `unit_id`, `tenant_id`, `category`, `priority`, `description`
- Validation: Ensure `category` in ["Plumbing", "Electrical", "HVAC", "Appliance", "Other"]
- Validation: Ensure `priority` in ["Low", "Medium", "High", "Emergency"]
- Output: `MaintenanceRequestRead` with generated `id`


**PATCH `/maintenance/{id}`**
- Input: `MaintenanceRequestUpdate` (partial)
- Logic: Update only provided fields
- Logic: If `status` changes to "Resolved" and `resolved_date` not provided, auto-set to current timestamp
- Validation: If provided, validate `category` and `priority` enums
- Output: Updated `MaintenanceRequestRead`
- Error: 404 if id not found

**GET `/maintenance/summary`**
- Input: None
- Logic: Query all requests, count by `status` and `priority`
- Output:
```json
{
  "by_status": {
    "Open": <count>,
    "In Progress": <count>,
    "Resolved": <count>
  },
  "by_priority": {
    "Low": <count>,
    "Medium": <count>,
    "High": <count>,
    "Emergency": <count>
  }
}
```

#### 3. Database Seeding (`seed_maintenance.py`)

**Sample Data Requirements:**
- At least 8 diverse maintenance requests
- Cover all categories: Plumbing, Electrical, HVAC, Appliance, Other
- Cover all priorities: Low, Medium, High, Emergency
- Cover all statuses: Open, In Progress, Resolved
- Reference existing `unit_id` and `tenant_id` from seed data
- Include both assigned and unassigned requests
- Include resolved requests with `resolved_date` set


### Frontend Components

#### 1. MaintenancePage Component (`MaintenancePage.tsx`)

**State Management:**
```typescript
const [requests, setRequests] = useState<MaintenanceRequest[]>([])
const [loading, setLoading] = useState(true)
const [error, setError] = useState<string | null>(null)
const [saving, setSaving] = useState(false)
const [search, setSearch] = useState("")
const [filter, setFilter] = useState("All")  // "All" | "Open" | "In Progress" | "Resolved"

// Modal state
const [addOpen, setAddOpen] = useState(false)
const [editRequest, setEditRequest] = useState<MaintenanceRequest | null>(null)
const [delRequest, setDelRequest] = useState<MaintenanceRequest | null>(null)

// Form state
const [form, setForm] = useState<MaintenanceRequestFormData>(EMPTY_FORM)
```

**MaintenanceRequest Type:**
```typescript
interface MaintenanceRequest {
  id: number
  unit_id: number
  tenant_id: number
  category: "Plumbing" | "Electrical" | "HVAC" | "Appliance" | "Other"
  priority: "Low" | "Medium" | "High" | "Emergency"
  status: "Open" | "In Progress" | "Resolved"
  description: string
  submitted_date: string
  resolved_date: string | null
  assigned_to: string | null
}
```


**Component Hierarchy:**
```
MaintenancePage
├── Header (Title + "Add Request" button)
├── ErrorBanner (conditional)
├── SearchInput
├── StatusFilterTabs ("All", "Open", "In Progress", "Resolved")
├── LoadingSkeleton (conditional)
├── MobileCardList (responsive: visible on mobile)
│   └── MaintenanceCard[] (each with status badge, edit/delete buttons)
├── DesktopTable (responsive: visible on desktop)
│   └── MaintenanceRow[] (with hover actions)
├── AddRequestModal (conditional)
├── EditRequestModal (conditional)
└── DeleteConfirmModal (conditional)
```

**Key UI Patterns:**

1. **Status Badge Colors** (using shadcn/ui Badge component):
   - Open: `bg-amber-50 text-amber-700 ring-amber-200` (yellow)
   - In Progress: `bg-blue-50 text-blue-700 ring-blue-200` (blue)
   - Resolved: `bg-emerald-50 text-emerald-700 ring-emerald-200` (green)
   - Emergency (priority): `bg-red-50 text-red-700 ring-red-200` (red)

2. **Filter Tabs**: Active tab has `bg-emerald-600 text-white`, inactive has `bg-slate-100 text-slate-600`

3. **Loading Skeleton**: 3 animated pulse cards/rows while `loading === true`

4. **Error Banner**: Red alert with dismiss button, shown when `error !== null`


#### 2. Form Modals

**Add Request Modal:**
- Fields: unit_id (number input), tenant_id (number input), category (dropdown), priority (dropdown), description (textarea), assigned_to (text input, optional)
- Validation: Require unit_id, tenant_id, category, priority, description
- Submit: POST `/maintenance/` → refresh list → close modal
- Cancel: Close modal, clear form

**Edit Request Modal:**
- Pre-filled with current request data
- All fields editable including status
- Additional field: status (dropdown with "Open", "In Progress", "Resolved")
- Submit: PATCH `/maintenance/{id}` → update list in place → close modal
- Cancel: Close modal, discard changes

**Delete Confirm Modal:**
- Display: Request ID and description snippet
- Actions: Cancel or Confirm
- Confirm: DELETE `/maintenance/{id}` → remove from list → close modal

---

## Data Models

### MaintenanceRequest Table Schema

```sql
CREATE TABLE maintenancerequest (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    unit_id INTEGER NOT NULL,
    tenant_id INTEGER NOT NULL,
    category VARCHAR NOT NULL,
    priority VARCHAR NOT NULL,
    status VARCHAR NOT NULL DEFAULT 'Open',
    description TEXT NOT NULL,
    submitted_date VARCHAR NOT NULL,
    resolved_date VARCHAR,
    assigned_to VARCHAR
);
```


**Field Descriptions:**

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY, AUTOINCREMENT | Unique identifier |
| unit_id | INTEGER | NOT NULL | Foreign key to Unit.id |
| tenant_id | INTEGER | NOT NULL | Foreign key to Tenant.id |
| category | VARCHAR | NOT NULL | Issue category enum |
| priority | VARCHAR | NOT NULL | Urgency level enum |
| status | VARCHAR | NOT NULL, DEFAULT 'Open' | Current state enum |
| description | TEXT | NOT NULL | Detailed issue description |
| submitted_date | VARCHAR | NOT NULL | Timestamp when created |
| resolved_date | VARCHAR | NULL | Timestamp when resolved (if status=Resolved) |
| assigned_to | VARCHAR | NULL | Technician name (optional) |

**Enum Values:**
- `category`: "Plumbing", "Electrical", "HVAC", "Appliance", "Other"
- `priority`: "Low", "Medium", "High", "Emergency"
- `status`: "Open", "In Progress", "Resolved"

**Relationships:**
- `unit_id` references `unit.id` (many-to-one: many requests can reference one unit)
- `tenant_id` references `tenant.id` (many-to-one: many requests can reference one tenant)


**Indexing Strategy:**
- Primary key index on `id` (automatic)
- Consider adding index on `status` for filtering performance
- Consider adding index on `unit_id` and `tenant_id` for join queries

### API Request/Response Formats

**POST /maintenance/ Request:**
```json
{
  "unit_id": 1,
  "tenant_id": 2,
  "category": "Plumbing",
  "priority": "High",
  "description": "Kitchen sink is leaking under the cabinet",
  "assigned_to": "Mike Johnson"
}
```

**POST /maintenance/ Response (201):**
```json
{
  "id": 42,
  "unit_id": 1,
  "tenant_id": 2,
  "category": "Plumbing",
  "priority": "High",
  "status": "Open",
  "description": "Kitchen sink is leaking under the cabinet",
  "submitted_date": "2024-06-15T10:30:00",
  "resolved_date": null,
  "assigned_to": "Mike Johnson"
}
```


**PATCH /maintenance/{id} Request:**
```json
{
  "status": "Resolved",
  "assigned_to": "Mike Johnson"
}
```

**PATCH /maintenance/{id} Response (200):**
```json
{
  "id": 42,
  "unit_id": 1,
  "tenant_id": 2,
  "category": "Plumbing",
  "priority": "High",
  "status": "Resolved",
  "description": "Kitchen sink is leaking under the cabinet",
  "submitted_date": "2024-06-15T10:30:00",
  "resolved_date": "2024-06-16T14:45:00",
  "assigned_to": "Mike Johnson"
}
```

**GET /maintenance/summary Response (200):**
```json
{
  "by_status": {
    "Open": 12,
    "In Progress": 5,
    "Resolved": 38
  },
  "by_priority": {
    "Low": 8,
    "Medium": 15,
    "High": 7,
    "Emergency": 2
  }
}
```

---

## Error Handling


### Backend Error Handling

**Validation Errors (422):**
- Triggered by: Missing required fields, invalid enum values, type mismatches
- Response format:
```json
{
  "detail": [
    {
      "loc": ["body", "category"],
      "msg": "value is not a valid enumeration member",
      "type": "type_error.enum"
    }
  ]
}
```
- Handling: FastAPI/Pydantic automatic validation

**Not Found Errors (404):**
- Triggered by: GET/PATCH/DELETE with non-existent id
- Response format:
```json
{
  "detail": "Maintenance request not found"
}
```
- Handling: Explicit check after `session.get(MaintenanceRequest, id)`

**Foreign Key Violations:**
- Scenario: Creating request with invalid `unit_id` or `tenant_id`
- SQLite behavior: May allow insertion if no FK constraints defined
- Mitigation: Consider adding validation in endpoint to verify unit/tenant exists
- Alternative: Define FK constraints in SQLModel (requires migration strategy)


**Database Errors (500):**
- Triggered by: Connection failures, constraint violations
- Response format:
```json
{
  "detail": "Internal server error"
}
```
- Handling: FastAPI default error handler (avoid leaking implementation details)

### Frontend Error Handling

**Network Errors:**
- Scenario: Backend unreachable, timeout
- Display: Error banner with message "Failed to load maintenance requests"
- Recovery: Manual retry via refresh or re-fetch button

**API Errors (4xx/5xx):**
- Scenario: Backend returns error response
- Extraction: Parse `error.detail` from JSON response
- Display: Error banner with specific message
- Example: "Maintenance request not found" for 404

**Validation Errors:**
- Frontend validation: Disable submit button when required fields empty
- Backend validation errors (422): Display field-specific errors in form
- Implementation: Parse Pydantic error array, map to form fields


**Optimistic Updates:**
- Pattern: Update local state immediately, rollback on error
- Implementation: For edit/delete operations, update `requests` array first
- Error case: Show error banner, revert state change, optionally refetch from server

**Loading States:**
- Initial page load: Show skeleton animation
- CRUD operations: Disable buttons, show spinner icon
- Form submission: Disable submit button, show "Saving..." indicator

---

## Testing Strategy

### Overview

Since this is a standard CRUD feature with database I/O and UI rendering, **property-based testing is not appropriate**. The testing strategy focuses on:
- **Unit tests** for specific API endpoint behaviors and edge cases
- **Integration tests** for database operations and end-to-end request flows
- **Frontend component tests** for UI interactions and form validation
- **Manual testing** for responsive design and accessibility

### Backend Testing

#### Unit Tests (pytest)

**Test Coverage Areas:**
1. **Endpoint Response Codes**
   - POST with valid data returns 201
   - POST with missing fields returns 422
   - GET with valid id returns 200
   - GET with invalid id returns 404
   - PATCH with valid id returns 200
   - PATCH with invalid id returns 404
   - DELETE with valid id returns 204
   - DELETE with invalid id returns 404


2. **Automatic Field Setting**
   - Test that `submitted_date` is set automatically on POST
   - Test that `status` defaults to "Open" on POST
   - Test that `resolved_date` is set when status changes to "Resolved"
   - Test that `resolved_date` is not overwritten if already provided

3. **Validation Logic**
   - Test invalid category values are rejected (422)
   - Test invalid priority values are rejected (422)
   - Test invalid status values are rejected (422)
   - Test empty description is rejected (422)
   - Test missing required fields are rejected (422)

4. **Partial Update Behavior**
   - Test PATCH only updates provided fields
   - Test PATCH does not modify unprovided fields
   - Test PATCH with empty update body succeeds

5. **Summary Endpoint**
   - Test summary returns correct counts by status
   - Test summary returns correct counts by priority
   - Test summary with empty database returns zero counts
   - Test summary structure matches expected JSON format

**Example Test Structure:**
```python
def test_create_request_sets_submitted_date(client, db_session):
    response = client.post("/maintenance/", json={
        "unit_id": 1, "tenant_id": 1, "category": "Plumbing",
        "priority": "High", "description": "Leak in kitchen"
    })
    assert response.status_code == 201
    data = response.json()
    assert data["submitted_date"] is not None
    assert data["status"] == "Open"
```


#### Integration Tests

**Test Coverage Areas:**
1. **Database Persistence**
   - Test created request is retrievable via GET
   - Test updated request persists changes
   - Test deleted request is no longer retrievable
   - Test summary reflects actual database counts

2. **Concurrent Operations**
   - Test multiple simultaneous updates don't corrupt data
   - Test summary remains consistent during rapid creates

3. **Foreign Key Behavior** (if constraints are implemented)
   - Test creating request with invalid unit_id
   - Test creating request with invalid tenant_id

**Test Environment:**
- Use separate test database (`:memory:` SQLite or `test.db`)
- Reset database state between tests
- Seed minimal required data (units, tenants)

### Frontend Testing

#### Component Tests (Vitest + React Testing Library)

**Test Coverage Areas:**
1. **Data Fetching**
   - Test loading skeleton displays while fetching
   - Test requests list renders after successful fetch
   - Test error banner displays when fetch fails


2. **Filtering and Search**
   - Test status filter tabs filter correctly
   - Test search input filters by description/unit
   - Test "All" filter shows all requests
   - Test filter count badges display correct numbers

3. **Form Interactions**
   - Test "Add Request" button opens modal
   - Test form validation disables submit when required fields empty
   - Test form submission calls API and closes modal
   - Test edit button pre-fills form with request data
   - Test cancel button closes modal without saving

4. **CRUD Operations**
   - Test successful create adds request to list
   - Test successful update refreshes request in list
   - Test successful delete removes request from list
   - Test error responses display error banner

5. **Status Badge Rendering**
   - Test "Open" status renders yellow badge
   - Test "In Progress" status renders blue badge
   - Test "Resolved" status renders green badge
   - Test "Emergency" priority renders red badge

**Example Test Structure:**
```typescript
test('displays loading skeleton while fetching', () => {
  render(<MaintenancePage />)
  expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument()
})

test('filters requests by status', async () => {
  render(<MaintenancePage />)
  await waitFor(() => expect(screen.getByText('Open')).toBeInTheDocument())
  fireEvent.click(screen.getByText('Resolved'))
  expect(screen.queryByText('Open request')).not.toBeInTheDocument()
  expect(screen.getByText('Resolved request')).toBeInTheDocument()
})
```


#### Manual Testing Checklist

**Responsive Design:**
- [ ] Mobile view displays card layout
- [ ] Desktop view displays table layout
- [ ] Modals are responsive on mobile and desktop
- [ ] Touch targets meet 44x44px minimum on mobile

**Accessibility:**
- [ ] Keyboard navigation works for all interactive elements
- [ ] Form labels are properly associated with inputs
- [ ] Error messages are announced by screen readers
- [ ] Status badges have sufficient color contrast
- [ ] Focus indicators are visible on all focusable elements

**Browser Compatibility:**
- [ ] Test in Chrome, Firefox, Safari, Edge
- [ ] Test mobile Safari and Chrome on iOS/Android
- [ ] Verify fetch API polyfills if supporting older browsers

**User Flows:**
- [ ] Complete flow: Create → Edit → Resolve → Delete
- [ ] Error recovery: Create with invalid data, see error, correct and retry
- [ ] Concurrent users: Two users editing same request (last write wins)

### Test Data Strategy

**Seed Data Requirements:**
- 3 units with different configurations
- 3 tenants associated with units
- 8+ maintenance requests covering:
  - All categories (Plumbing, Electrical, HVAC, Appliance, Other)
  - All priorities (Low, Medium, High, Emergency)
  - All statuses (Open, In Progress, Resolved)
  - Mix of assigned/unassigned technicians
  - Mix of with/without resolved_date


**Edge Cases to Test:**
- Empty database (no requests)
- Single request in database
- Very long description text (test truncation/wrapping)
- Special characters in description (quotes, Unicode)
- Multiple requests for same unit
- Requests with null assigned_to
- Requests with very old submitted_date

---

## Implementation Notes

### Development Sequence

**Phase 1: Backend Foundation**
1. Create `models_maintenance.py` with all model classes
2. Update `database.py` to import MaintenanceRequest model
3. Create `routers/maintenance.py` with all 6 endpoints
4. Update `main.py` to register maintenance router
5. Test endpoints with curl/Postman
6. Create `seed_maintenance.py` and run seeding

**Phase 2: Frontend Implementation**
7. Create `MaintenancePage.tsx` component skeleton
8. Implement data fetching and loading states
9. Implement mobile card layout
10. Implement desktop table layout
11. Implement Add Request modal and form
12. Implement Edit Request modal
13. Implement Delete Confirm modal
14. Implement status filtering and search
15. Implement status badge styling
16. Update `App.tsx` to route to MaintenancePage


**Phase 3: Testing and Refinement**
17. Write backend unit tests
18. Write backend integration tests
19. Write frontend component tests
20. Perform manual testing checklist
21. Fix bugs and refine UX
22. Document any deviations from design

### Code Style and Conventions

**Backend (Python):**
- Follow PEP 8 style guide
- Use type hints for all function signatures
- Match existing patterns in `routers/units.py` and `routers/tenants.py`
- Use consistent error messages ("Maintenance request not found")

**Frontend (TypeScript/React):**
- Follow existing component patterns in `UnitsPage.tsx` and `TenantsPage.tsx`
- Use consistent naming: `MaintenancePage`, `MaintenanceRequest`, `handleCreate`, etc.
- Use Tailwind CSS classes matching existing pages
- Use shadcn/ui components for consistency
- Extract repeated UI patterns into helper components/functions

### Performance Considerations

**Backend:**
- No pagination needed initially (< 100 requests expected)
- Consider adding pagination if dataset grows (add `?limit=50&offset=0`)
- Summary endpoint is O(n) over all requests (acceptable for < 1000 records)
- Add indexes if query performance degrades


**Frontend:**
- Fetch all requests on page load (no lazy loading initially)
- Client-side filtering/searching is fast for < 100 items
- Debounce search input if performance issues arise
- Consider virtual scrolling if list exceeds 500 items

### Security Considerations

**Authentication/Authorization:**
- Current implementation: No authentication (development phase)
- Future: Add JWT or session-based auth
- Future: Role-based access (property manager vs. tenant vs. technician)
- Future: Restrict tenants to viewing only their own requests

**Input Validation:**
- Backend: Pydantic validates all inputs automatically
- Frontend: Client-side validation for UX (not security)
- SQL Injection: Prevented by SQLModel parameterized queries
- XSS: React escapes rendered content by default

**Data Privacy:**
- No PII encryption in database (acceptable for development)
- Consider encrypting tenant contact info in production
- HTTPS required in production to protect data in transit

### Deployment Considerations

**Database Migrations:**
- SQLModel creates tables automatically on startup (development)
- Production: Use Alembic for versioned migrations
- Migration strategy: Add new table without disrupting existing data


**Environment Configuration:**
- Backend: No new environment variables needed
- Frontend: Uses existing `VITE_API_URL`
- CORS: Already configured in `main.py` for development

**Monitoring:**
- Log all 500 errors for debugging
- Consider adding metrics for request creation rate
- Monitor response times for summary endpoint

---

## Open Questions and Future Enhancements

### Open Questions (to be resolved during implementation)

1. **Date Format:** Should `submitted_date` and `resolved_date` use ISO 8601 ("2024-06-15T10:30:00") or friendly format ("Jun 15, 2024")? 
   - Recommendation: ISO 8601 for consistency with other systems, format on frontend

2. **Technician Assignment:** Should `assigned_to` be a dropdown from a predefined list of technicians, or free text?
   - Recommendation: Free text initially, migrate to Technician table in future

3. **Unit/Tenant Display:** Should frontend display unit number and tenant name, or just IDs?
   - Recommendation: Fetch unit/tenant data and display names for better UX (may require endpoint changes)

4. **Concurrent Edit Handling:** What happens if two users edit the same request simultaneously?
   - Current: Last write wins (no conflict detection)
   - Future: Add optimistic locking with version field


### Future Enhancements

**Phase 2 Features:**
- File upload for issue photos (before/after)
- Email notifications when request status changes
- Push notifications for mobile app
- Technician calendar view for assignment scheduling
- Request priority auto-escalation based on age
- Recurring maintenance schedules (HVAC filter changes, etc.)

**Reporting and Analytics:**
- Average resolution time by category
- Most common issue types
- Technician performance metrics (requests handled, avg time)
- Unit maintenance history report
- Cost tracking per request

**Integration Opportunities:**
- Twilio SMS notifications for urgent requests
- Slack/Discord bot for real-time alerts
- Calendar integration for scheduled maintenance
- Third-party vendor management system

**User Experience Improvements:**
- Drag-and-drop file upload
- Rich text editor for description (formatting, links)
- Request templates for common issues
- Bulk operations (assign multiple requests to technician)
- Request timeline view (status change history)
- Comment/note system for updates

---

## Appendix

### API Quick Reference

```
GET    /maintenance/           → List all requests
GET    /maintenance/{id}       → Get single request
POST   /maintenance/           → Create request
PATCH  /maintenance/{id}       → Update request
DELETE /maintenance/{id}       → Delete request
GET    /maintenance/summary    → Get statistics
```


### Status Transitions

```
[New Request]
      ↓
    Open ──────→ In Progress ──────→ Resolved
      ↓              ↓                   ↑
      └──────────────┴───────────────────┘
         (any status can transition to any other)
```

### Component File Structure

```
backend/src/app/
├── models_maintenance.py       # MaintenanceRequest models
├── routers/
│   └── maintenance.py          # API endpoints
├── seed_maintenance.py         # Sample data
├── database.py                 # (update: import MaintenanceRequest)
└── main.py                     # (update: include_router)

frontend/src/app/
├── pages/
│   └── MaintenancePage.tsx     # Main component
└── App.tsx                     # (update: add route)
```

### Estimated Effort

- Backend Models & Router: 4-6 hours
- Backend Testing: 3-4 hours
- Frontend Component: 8-10 hours
- Frontend Testing: 4-5 hours
- Manual Testing & Bug Fixes: 3-4 hours
- **Total: 22-29 hours**

---

**Document Version:** 1.0  
**Last Updated:** 2024-06-15  
**Status:** Ready for Implementation
npm i

up to date, audited 285 packages in 2s

35 packages are looking for funding
  run `npm fund` for details

2 high severity vulnerabilities

To address all issues, run:
  npm audit fix --force

Run `npm audit` for details.
npm warn allow-scripts 2 packages have install scripts not yet covered by allowScripts:
npm warn allow-scripts   @tailwindcss/oxide@4.1.12 (install: (install scripts present))
npm warn allow-scripts   esbuild@0.25.12 (install: (install scripts present))
npm warn allow-scripts
npm warn allow-scripts Run `npm approve-scripts --allow-scripts-pending` to review, or `npm approve-scripts <pkg>` to allow.
taban@tbh:~/projects/SaaS/frontend$ npm run dev

> @figma/my-make-file@0.0.1 dev
> vite

Port 5173 is in use, trying another one...
node:internal/fs/watchers:321
    const error = new UVException({
                  ^

Error: ENOSPC: System limit for number of file watchers reached, watch '/home/taban/projects/SaaS/frontend/.gitignore'
    at FSWatcher.<computed> (node:internal/fs/watchers:321:19)
    at Object.watch (node:fs:2548:36)
    at createFsWatchInstance (file:///home/taban/projects/SaaS/frontend/node_modules/vite/dist/node/chunks/dep-DBxKXgDP.js:22195:17)
    at setFsWatchListener (file:///home/taban/projects/SaaS/frontend/node_modules/vite/dist/node/chunks/dep-DBxKXgDP.js:22242:15)
    at NodeFsHandler._watchWithNodeFs (file:///home/taban/projects/SaaS/frontend/node_modules/vite/dist/node/chunks/dep-DBxKXgDP.js:22397:14)
    at NodeFsHandler._handleFile (file:///home/taban/projects/SaaS/frontend/node_modules/vite/dist/node/chunks/dep-DBxKXgDP.js:22461:23)
    at NodeFsHandler._addToNodeFs (file:///home/taban/projects/SaaS/frontend/node_modules/vite/dist/node/chunks/dep-DBxKXgDP.js:22703:21)
Emitted 'error' event on FSWatcher instance at:
    at FSWatcher._handleError (file:///home/taban/projects/SaaS/frontend/node_modules/vite/dist/node/chunks/dep-DBxKXgDP.js:23896:10)
    at NodeFsHandler._addToNodeFs (file:///home/taban/projects/SaaS/frontend/node_modules/vite/dist/node/chunks/dep-DBxKXgDP.js:22711:18) {
  errno: -28,
  syscall: 'watch',
  code: 'ENOSPC',
  path: '/home/taban/projects/SaaS/frontend/.gitignore',
  filename: '/home/taban/projects/SaaS/frontend/.gitignore'
}

Node.js v24.18.0
taban@tbh:~/projects/SaaS/frontend$ 