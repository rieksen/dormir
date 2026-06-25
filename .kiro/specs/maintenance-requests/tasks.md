# Implementation Plan: Maintenance Requests

## Overview

This plan implements a complete CRUD workflow for maintenance request tracking in the APTv16 system, following established patterns from Units, Tenants, Payments, and Leases modules. The implementation uses Python (FastAPI + SQLModel) for the backend and TypeScript/React for the frontend.

## Tasks

- [x] 1. Create backend data models
  - [x] 1.1 Create `models_maintenance.py` with MaintenanceRequest models
    - Define `MaintenanceRequestBase` with all fields: unit_id, tenant_id, category, priority, status, description, submitted_date, resolved_date, assigned_to
    - Define `MaintenanceRequest` table model with id primary key
    - Define `MaintenanceRequestCreate` schema (excluding id)
    - Define `MaintenanceRequestUpdate` schema (all fields optional except id)
    - Define `MaintenanceRequestRead` schema (including id)
    - Use category enum: "Plumbing", "Electrical", "HVAC", "Appliance", "Other"
    - Use priority enum: "Low", "Medium", "High", "Emergency"
    - Use status enum with default "Open": "Open", "In Progress", "Resolved"
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

- [x] 2. Register MaintenanceRequest model in database
  - [x] 2.1 Update `database.py` to import MaintenanceRequest model and configure PostgreSQL
    - Update DATABASE_URL to PostgreSQL connection string: `postgresql://user:password@localhost/maintenance_requests_db`
    - Add import statement: `from .models_maintenance import MaintenanceRequest  # noqa: F401`
    - Place import in `create_db_and_tables()` function alongside other model imports
    - Install psycopg2 driver for PostgreSQL: `pip install psycopg2-binary`
    - _Requirements: 11.1_

- [x] 3. Implement backend API router
  - [x] 3.1 Create `routers/maintenance.py` with CRUD endpoints
    - Implement GET `/` to list all maintenance requests
    - Implement GET `/{id}` to retrieve single request (404 if not found)
    - Implement POST `/` to create request (set submitted_date automatically, default status="Open", return 201)
    - Implement PATCH `/{id}` to update request (support partial updates, auto-set resolved_date when status changes to "Resolved", 404 if not found)
    - Implement DELETE `/{id}` to delete request (204 on success, 404 if not found)
    - Implement GET `/summary` to return counts grouped by status and priority
    - Follow patterns from `routers/units.py` and `routers/tenants.py`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 2.1, 2.2, 2.3, 3.1, 3.2, 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.2, 6.1, 6.2, 6.3, 6.4_

  - [x] 3.2 Write unit tests for maintenance router endpoints
    - Test POST with valid data returns 201
    - Test POST with missing required fields returns 422
    - Test GET with valid id returns 200
    - Test GET with invalid id returns 404
    - Test PATCH with valid id returns 200 and updates only provided fields
    - Test PATCH with invalid id returns 404
    - Test DELETE with valid id returns 204
    - Test DELETE with invalid id returns 404
    - Test submitted_date is set automatically on POST
    - Test status defaults to "Open" on POST
    - Test resolved_date is set when status changes to "Resolved"
    - Test invalid category/priority/status values are rejected (422)
    - Test summary endpoint returns correct structure and counts
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 4.4_

- [x] 4. Register maintenance router in FastAPI app
  - [x] 4.1 Update `main.py` to include maintenance router
    - Add import: `from .routers import maintenance`
    - Add router registration: `app.include_router(maintenance.router, prefix="/maintenance", tags=["maintenance"])`
    - Place alongside other router registrations (units, tenants, payments, leases)
    - _Requirements: 1.1, 2.1, 3.1, 4.1, 5.1, 6.1_

- [x] 5. Create seed data for maintenance requests
  - [x] 5.1 Create `seed_maintenance.py` with sample data for PostgreSQL
    - Create at least 8 diverse maintenance requests
    - Include all categories: Plumbing, Electrical, HVAC, Appliance, Other
    - Include all priorities: Low, Medium, High, Emergency
    - Include all statuses: Open, In Progress, Resolved
    - Reference valid unit_id and tenant_id from existing seed data (units 101-403, tenants 1-8)
    - Include mix of assigned/unassigned technicians
    - Include resolved requests with resolved_date set
    - Use PostgreSQL-compatible SQL operations (use psycopg2 or SQLModel Session with PostgreSQL backend)
    - Follow pattern from `seed_tenants.py`
    - _Requirements: 11.1, 11.2, 11.3, 11.4_

- [x] 6. Checkpoint - Verify backend implementation
  - Ensure database tables are created successfully
  - Run seed script and verify data is inserted
  - Test all API endpoints with curl or Postman
  - Ensure all tests pass, ask the user if questions arise

- [x] 7. Create frontend MaintenancePage component
  - [x] 7.1 Create `pages/MaintenancePage.tsx` skeleton with state management
    - Define MaintenanceRequest TypeScript interface matching backend schema
    - Set up state: requests array, loading, error, saving, search, filter, modals (add, edit, delete)
    - Define form state type and empty form constant
    - Create API helper functions (apiFetch wrapper following UnitsPage pattern)
    - Implement fetchRequests function with error handling
    - Use useEffect to fetch data on mount
    - _Requirements: 7.1, 7.2_

  - [x] 7.2 Implement mobile card layout for maintenance requests
    - Create card component showing request details
    - Display status badge with color coding: Open (yellow), In Progress (blue), Resolved (green), Emergency (red)
    - Show unit_id, tenant_id, category, priority, status, description, submitted_date, assigned_to
    - Add edit and delete action buttons
    - Show loading skeleton while fetching (3 animated pulse cards)
    - Display error banner if fetch fails
    - Follow responsive patterns from UnitsPage mobile cards
    - _Requirements: 7.2, 7.3, 7.4, 7.5, 7.7_

  - [x] 7.3 Implement desktop table layout for maintenance requests
    - Create table with columns: ID, Unit, Tenant, Category, Priority, Status, Description, Submitted, Assigned To, Actions
    - Use hover effects to show action buttons (view, edit, delete)
    - Apply consistent styling with existing pages
    - Show status badges with proper color coding
    - Handle empty state (no matching requests)
    - _Requirements: 7.3, 7.4, 7.5_

  - [x] 7.4 Implement search and filter functionality
    - Add search input to filter by description, unit_id, or tenant_id
    - Add status filter tabs: All, Open, In Progress, Resolved
    - Show count badges on filter tabs
    - Apply filters to displayed requests
    - _Requirements: 7.6_

- [x] 8. Implement Add Maintenance Request modal
  - [x] 8.1 Create Add Request modal with form
    - Display modal when "Add Request" button clicked
    - Include form fields: unit_id (number), tenant_id (number), category (dropdown), priority (dropdown), description (textarea), assigned_to (text, optional)
    - Validate required fields before enabling submit: unit_id, tenant_id, category, priority, description
    - Handle form submission (POST request to /maintenance/)
    - Show loading state during submission
    - On success: close modal, clear form, refresh request list
    - On error: display error banner with message
    - Match modal styling from UnitsPage
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7_

- [x] 9. Implement Edit Maintenance Request modal
  - [x] 9.1 Create Edit Request modal with pre-filled form
    - Pre-fill form with current request data
    - Allow editing all fields including status dropdown
    - Handle form submission (PATCH request to /maintenance/{id})
    - Show loading state during submission
    - On success: close modal, update request in list
    - On error: display error banner with message
    - Match modal styling from UnitsPage EditUnitModal
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 10. Implement Delete Confirmation modal
  - [x] 10.1 Create Delete Confirm modal
    - Display request id and description in confirmation message
    - Show warning about permanent deletion
    - Handle delete confirmation (DELETE request to /maintenance/{id})
    - Show loading state during deletion
    - On success: close modal, remove request from list
    - On error: display error banner with message
    - Match modal styling from UnitsPage delete confirmation
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ] 11. Wire MaintenancePage into frontend application
  - [x] 11.1 Update `App.tsx` to route to MaintenancePage
    - Import MaintenancePage component
    - Add "maintenance" case to page switch statement
    - Ensure navigation from sidebar and bottom nav works correctly
    - Verify page loads and displays properly on mobile and desktop
    - _Requirements: 7.1_

  - [-] 11.2 Write component tests for MaintenancePage
    - Test loading skeleton displays while fetching
    - Test requests list renders after successful fetch
    - Test error banner displays when fetch fails
    - Test status filter tabs filter correctly
    - Test search input filters by description/unit
    - Test "Add Request" button opens modal
    - Test form validation disables submit when required fields empty
    - Test edit button pre-fills form with request data
    - Test delete button shows confirmation modal
    - Test status badge colors: Open (yellow), In Progress (blue), Resolved (green), Emergency (red)

- [~] 12. Final checkpoint - End-to-end testing
  - Test complete create → edit → resolve → delete flow
  - Verify responsive design on mobile and desktop
  - Test error handling for network failures
  - Ensure all CRUD operations work correctly
  - Verify seed data displays properly
  - Ensure all tests pass, ask the user if questions arise

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Backend uses Python with FastAPI and SQLModel
- Frontend uses TypeScript with React and shadcn/ui components
- All patterns follow existing codebase conventions from Units, Tenants, Payments, and Leases modules
- Checkpoints ensure incremental validation

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["2.1", "5.1"] },
    { "id": 2, "tasks": ["3.1"] },
    { "id": 3, "tasks": ["3.2", "4.1"] },
    { "id": 4, "tasks": ["7.1"] },
    { "id": 5, "tasks": ["7.2", "7.3", "7.4"] },
    { "id": 6, "tasks": ["8.1", "9.1", "10.1"] },
    { "id": 7, "tasks": ["11.1"] },
    { "id": 8, "tasks": ["11.2"] }
  ]
}
```
