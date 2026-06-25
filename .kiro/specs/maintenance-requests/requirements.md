# Requirements Document

## Introduction

The Maintenance Requests feature enables property managers to track and manage maintenance issues reported by tenants. This system provides a complete workflow for submitting, tracking, and resolving maintenance requests across apartment units, supporting different categories of issues (Plumbing, Electrical, HVAC, Appliance, Other) and priority levels (Low, Medium, High, Emergency). The feature integrates with the existing APTv16 apartment management system's Units and Tenants data.

## Glossary

- **Maintenance_Request_System**: The backend and frontend components that handle maintenance request CRUD operations
- **Property_Manager**: The user who views, assigns, and resolves maintenance requests
- **Request**: A maintenance request entity with id, category, priority, status, and other tracking fields
- **Category**: Classification of maintenance issue (Plumbing, Electrical, HVAC, Appliance, Other)
- **Priority**: Urgency level (Low, Medium, High, Emergency)
- **Status**: Current state of a request (Open, In Progress, Resolved)
- **Technician**: A person assigned to handle a maintenance request (stored as assigned_to field)

## Requirements

### Requirement 1: Create Maintenance Request

**User Story:** As a property manager, I want to create a new maintenance request for a unit, so that I can track maintenance issues reported by tenants.

#### Acceptance Criteria

1. WHEN a POST request is sent to /maintenance/ with valid request data, THE Maintenance_Request_System SHALL create a new Request record and return it with status 201
2. THE Maintenance_Request_System SHALL require unit_id, tenant_id, category, priority, and description fields
3. THE Maintenance_Request_System SHALL set submitted_date to the current timestamp automatically
4. THE Maintenance_Request_System SHALL initialize status to "Open" by default
5. THE Maintenance_Request_System SHALL allow category values: "Plumbing", "Electrical", "HVAC", "Appliance", or "Other"
6. THE Maintenance_Request_System SHALL allow priority values: "Low", "Medium", "High", or "Emergency"
7. IF required fields are missing or invalid, THEN THE Maintenance_Request_System SHALL return a 422 validation error and any failure to return 422 SHALL be treated as a system failure

### Requirement 2: List All Maintenance Requests

**User Story:** As a property manager, I want to view all maintenance requests, so that I can see the complete list of issues across all units.

#### Acceptance Criteria

1. WHEN a GET request is sent to /maintenance/, THE Maintenance_Request_System SHALL return all Request records as a JSON array
2. THE Maintenance_Request_System SHALL include all fields (id, unit_id, tenant_id, category, priority, status, description, submitted_date, resolved_date, assigned_to) for each Request
3. THE Maintenance_Request_System SHALL return an empty array when no requests exist

### Requirement 3: Retrieve Single Maintenance Request

**User Story:** As a property manager, I want to view details of a specific maintenance request, so that I can review all information about a particular issue.

#### Acceptance Criteria

1. WHEN a GET request is sent to /maintenance/{id} with a valid id, THE Maintenance_Request_System SHALL return the matching Request record
2. IF the id does not exist, THEN THE Maintenance_Request_System SHALL return a 404 error with message "Maintenance request not found"

### Requirement 4: Update Maintenance Request

**User Story:** As a property manager, I want to update maintenance request details, so that I can modify status, assign technicians, or change priority as the situation evolves.

#### Acceptance Criteria

1. WHEN a PATCH request is sent to /maintenance/{id} with valid update data, THE Maintenance_Request_System SHALL update the specified fields and return the updated Request
2. THE Maintenance_Request_System SHALL allow partial updates (only specified fields are updated)
3. THE Maintenance_Request_System SHALL allow updating: category, priority, status, description, assigned_to, resolved_date
4. WHEN status is changed to "Resolved" and resolved_date is not provided, THE Maintenance_Request_System SHALL set resolved_date to the current timestamp automatically
5. IF the id does not exist, THEN THE Maintenance_Request_System SHALL always return a 404 error

### Requirement 5: Delete Maintenance Request

**User Story:** As a property manager, I want to delete maintenance requests, so that I can remove duplicate or erroneous entries.

#### Acceptance Criteria

1. WHEN a DELETE request is sent to /maintenance/{id} with a valid id, THE Maintenance_Request_System SHALL remove the Request record and return status 204
2. IF the id does not exist, THEN THE Maintenance_Request_System SHALL return a 404 error

### Requirement 6: Maintenance Requests Summary

**User Story:** As a property manager, I want to see summary statistics of maintenance requests, so that I can quickly understand the current maintenance workload.

#### Acceptance Criteria

1. WHEN a GET request is sent to /maintenance/summary, THE Maintenance_Request_System SHALL return counts grouped by status and priority
2. THE Maintenance_Request_System SHALL include counts for each status: "Open", "In Progress", "Resolved"
3. THE Maintenance_Request_System SHALL include counts for each priority: "Low", "Medium", "High", "Emergency"
4. THE Maintenance_Request_System SHALL return the summary as a JSON object with "by_status" and "by_priority" keys

### Requirement 7: Display Maintenance Requests Page

**User Story:** As a property manager, I want to view maintenance requests in the frontend, so that I can manage them through a user interface.

#### Acceptance Criteria

1. WHEN the Maintenance page is loaded, THE Maintenance_Request_System SHALL fetch all requests from /maintenance/ and display them
2. WHILE loading data, THE Maintenance_Request_System SHALL display a skeleton loading animation
3. THE Maintenance_Request_System SHALL display each Request with its id, unit_id, tenant_id, category, priority, status, description, submitted_date, and assigned_to
4. THE Maintenance_Request_System SHALL render status badges with color coding: "Open" = yellow, "In Progress" = blue, "Resolved" = green, independent of display state
5. WHERE priority is "Emergency", THE Maintenance_Request_System SHALL display the badge in red
6. THE Maintenance_Request_System SHALL provide filter tabs to filter requests by status (All, Open, In Progress, Resolved)
7. IF the API request fails, THEN THE Maintenance_Request_System SHALL display an error banner with the error message and MAY continue displaying cached data alongside the banner

### Requirement 8: Add Maintenance Request Form

**User Story:** As a property manager, I want to add new maintenance requests through a form, so that I can log issues without using API directly.

#### Acceptance Criteria

1. WHEN the "Add Request" button is clicked, THE Maintenance_Request_System SHALL display a modal form
2. THE Maintenance_Request_System SHALL provide input fields for: unit_id, tenant_id, category (dropdown), priority (dropdown), description (textarea), assigned_to
3. THE Maintenance_Request_System SHALL validate that required fields (unit_id, tenant_id, category, priority, description) are filled before enabling submit
4. WHEN the form is submitted with valid data, THE Maintenance_Request_System SHALL send a POST request to /maintenance/
5. WHEN the POST request succeeds, THE Maintenance_Request_System SHALL close the modal and refresh the request list
6. WHEN the modal closes after successful POST, THE Maintenance_Request_System SHALL clear the form
7. IF the POST request fails, THEN THE Maintenance_Request_System SHALL display the error message in an error banner

### Requirement 9: Edit Maintenance Request Form

**User Story:** As a property manager, I want to edit existing maintenance requests, so that I can update status, assign technicians, or modify details.

#### Acceptance Criteria

1. WHEN the edit button is clicked on a Request, THE Maintenance_Request_System SHALL display a modal form pre-filled with the request's current data
2. THE Maintenance_Request_System SHALL allow editing all fields: unit_id, tenant_id, category, priority, status, description, assigned_to
3. WHEN the form is submitted with changes, THE Maintenance_Request_System SHALL send a PATCH request to /maintenance/{id}
4. WHEN the PATCH request succeeds, THE Maintenance_Request_System SHALL close the modal and update the request in the list
5. IF the PATCH request fails, THEN THE Maintenance_Request_System SHALL display the error message

### Requirement 10: Delete Maintenance Request Confirmation

**User Story:** As a property manager, I want to confirm before deleting a maintenance request, so that I don't accidentally remove important records.

#### Acceptance Criteria

1. WHEN the delete button is clicked on a Request, THE Maintenance_Request_System SHALL display a confirmation modal
2. THE Maintenance_Request_System SHALL show the request id and description in the confirmation message
3. WHEN deletion is confirmed, THE Maintenance_Request_System SHALL send a DELETE request to /maintenance/{id}
4. WHEN the DELETE request succeeds, THE Maintenance_Request_System SHALL close the modal and remove the request from the list
5. IF the DELETE request fails, THEN THE Maintenance_Request_System SHALL display the error message

### Requirement 11: Database Schema and Seeding

**User Story:** As a developer, I want the maintenance_request table created automatically and seeded with sample data, so that I can test the feature immediately.

#### Acceptance Criteria

1. WHEN the application starts, THE Maintenance_Request_System SHALL create the maintenance_request table with columns: id (primary key), unit_id (integer), tenant_id (integer), category (string), priority (string), status (string), description (text), submitted_date (string), resolved_date (string, nullable), assigned_to (string, nullable)
2. THE Maintenance_Request_System SHALL create at least 8 sample maintenance requests when seed_maintenance.py is executed
3. THE Maintenance_Request_System SHALL include requests with different categories, priorities, and statuses in seed data
4. THE Maintenance_Request_System SHALL reference valid unit_id and tenant_id values from existing Units and Tenants tables
