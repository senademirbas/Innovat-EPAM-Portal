# PLAN-EVAL-001: Evaluation Workflow Implementation Plan

## Proposed Changes

### Database & Models
- **[MODIFY] [idea.py](file:///d:/Akademik/EPAM/EPAM_Course_Project/Innovat-EPAM-Portal/src/app/models/idea.py)**:
    - Add `status` column with default value `'submitted'`.
    - Add `admin_comment` column (Text, nullable).

### Schemas
- **[MODIFY] [idea.py](file:///d:/Akademik/EPAM/EPAM_Course_Project/Innovat-EPAM-Portal/src/app/schemas/idea.py)**:
    - Update `Idea` output schema to include `status` and `admin_comment`.
    - Create `IdeaEvaluation` schema for the patch request.

### CRUD Operations
- **[MODIFY] [idea.py](file:///d:/Akademik/EPAM/EPAM_Course_Project/Innovat-EPAM-Portal/src/app/crud/idea.py)**:
    - Implement `evaluate_idea(db, idea_id, status, comment)`.

### API Layer
- **[NEW] Endpoint in [admin.py](file:///d:/Akademik/EPAM/EPAM_Course_Project/Innovat-EPAM-Portal/src/app/api/admin.py)**:
    - `PATCH /admin/ideas/{idea_id}/evaluate`: Restricted to admins.
- **[MODIFY] [ideas.py](file:///d:/Akademik/EPAM/EPAM_Course_Project/Innovat-EPAM-Portal/src/app/api/ideas.py)**:
    - Ensure output schema update is reflected.

## Verification Plan

### Automated Tests
- **Integration Tests**:
    - `test_admin_evaluate_idea_success`: Admin changes status to 'accepted'.
    - `test_submitter_evaluate_idea_forbidden`: Submitter tries to change status (expect 403).
    - `test_submitter_views_evaluation`: Submitter sees 'rejected' status and comments.
    - `test_invalid_status_transition`: Ensure only valid status strings are accepted (if using Enum/constraints).

### Manual Verification
- Use Swagger UI to log in as admin, find an idea ID, and patch its status.
- Log in as the submitter and check the `GET /ideas` response.
