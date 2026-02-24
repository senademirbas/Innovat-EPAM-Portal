# SPEC-EVAL-001: Idea Evaluation Workflow

## Overview
The Evaluation Workflow enables administrators to review submitted project ideas, transition their status, and provide constructive feedback to submitters.

## User Stories
- **US1: Idea Status Tracking**: As a system, I want project ideas to have a status (submitted, under review, accepted, rejected) so their progress can be monitored.
- **US2: Administrative Evaluation**: As an admin, I want to accept or reject an idea and leave a comment, so that I can provide feedback to the submitter.
- **US3: Submitter Visibility**: As a submitter, I want to see the current status and admin comments on my ideas, so I know the outcome of the review.

## Requirements
- **Statuses**:
    - `submitted` (Default)
    - `under_review`
    - `accepted`
    - `rejected`
- **RBAC**:
    - Only users with `role == 'admin'` can change status or add evaluation comments.
    - Submitters can see comments and status but cannot edit them.
- **Data Model Updates**:
    - Add `status` field (String/Enum).
    - Add `admin_comment` field (Text, optional).

## API Endpoints
- `PATCH /admin/ideas/{idea_id}/evaluate`: Update idea status and add/update comments (Admin only).
- `GET /ideas/{idea_id}`: (Existing) Must return status and admin comments.

## Success Criteria
- [ ] Ideas default to 'submitted' status.
- [ ] Admins can successfully transition ideas to any valid status.
- [ ] Unauthorized users (submitters) cannot access the evaluation endpoint.
- [ ] Submitters see the correct status and comments on their dashboard.
- [ ] 80%+ test coverage for evaluation logic.
