# SPEC-IDEA-001: Idea Submission System

## Overview
The Idea Submission System allows authenticated users to submit project ideas, attaching a single file for support, and viewing their submissions.

## User Stories
- **US1: Submit Idea**: As a registered user, I want to submit an idea with a title, description, and category, and optional file attachment, so that my proposal is recorded.
- **US2: List Ideas**: As a registered user, I want to see a list of my submitted ideas.
- **US3: View Idea Detail**: As a registered user, I want to view the details of a specific idea I submitted, including the attachment link.

## Requirements
- **Authentication**: All endpoints require a valid JWT token.
- **Data Model**:
    - `id`: UUID/String (Primary Key)
    - `user_id`: String (Foreign Key to User)
    - `title`: String (Required)
    - `description`: Text (Required)
    - `category`: String (Required)
    - `file_path`: String (Optional, path to stored file)
    - `created_at`: Datetime
- **File Storage**: Attachments will be stored in a local `uploads/` directory for development.
- **Validation**:
    - Title: 3-100 characters.
    - Description: 10-2000 characters.
    - Category: Must be from a predefined list (e.g., "AI", "Cloud", "Sustainability", "Innovation").

## API Endpoints
- `POST /ideas`: Create a new idea (multipart/form-data for file support).
- `GET /ideas`: List all ideas submitted by the current user.
- `GET /ideas/{idea_id}`: Get details of a specific idea belonging to the current user.

## Success Criteria
- [ ] Users can submit ideas with and without files.
- [ ] Files are stored correctly on the filesystem.
- [ ] Users cannot see ideas submitted by others.
- [ ] Database correctly links ideas to the `User` model.
- [ ] 80%+ test coverage for idea-related logic.
