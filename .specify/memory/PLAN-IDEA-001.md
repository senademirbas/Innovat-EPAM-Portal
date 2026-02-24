# PLAN-IDEA-001: Idea Submission System Implementation Plan

## Proposed Changes

### Database & Models
- **[MODIFY] [user.py](file:///d:/Akademik/EPAM/EPAM_Course_Project/Innovat-EPAM-Portal/src/app/models/user.py)**: Add `Relationship` to `Idea` model (back-reference).
- **[NEW] [idea.py](file:///d:/Akademik/EPAM/EPAM_Course_Project/Innovat-EPAM-Portal/src/app/models/idea.py)**: Create `Idea` model.

### Schemas
- **[NEW] [idea.py](file:///d:/Akademik/EPAM/EPAM_Course_Project/Innovat-EPAM-Portal/src/app/schemas/idea.py)**: Create `IdeaCreate`, `IdeaUpdate`, and `Idea` output schemas.

### CRUD Operations
- **[NEW] [idea.py](file:///d:/Akademik/EPAM/EPAM_Course_Project/Innovat-EPAM-Portal/src/app/crud/idea.py)**: Implement `create_idea`, `get_idea`, and `get_user_ideas`.

### API Layer
- **[NEW] [ideas.py](file:///d:/Akademik/EPAM/EPAM_Course_Project/Innovat-EPAM-Portal/src/app/api/ideas.py)**: 
    - `POST /ideas`: Handled with `UploadFile` for attachments.
    - `GET /ideas`: Filtering by `current_user.id`.
    - `GET /ideas/{id}`: Detail view.
- **[MODIFY] [main.py](file:///d:/Akademik/EPAM/EPAM_Course_Project/Innovat-EPAM-Portal/src/app/main.py)**: Include the new ideas router.

### File Handling
- Create an `uploads/` directory in the root.
- Implement a utility for saving uploaded files safely.

## Verification Plan
- **Integration Tests**:
    - `test_create_idea_success`: Authenticated user, valid data, file attached.
    - `test_create_idea_unauthorized`: No token.
    - `test_list_my_ideas`: Ensure isolation (User A doesn't see User B's ideas).
    - `test_view_idea_detail`: Fetch specific idea.
- **Manual Verification**:
    - Use Swagger UI to upload a sample file and verify it appears in `uploads/`.
