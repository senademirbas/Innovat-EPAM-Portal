# Innovat-EPAM-Portal
Innovat-EPAM-Portal is a web application designed for managing project ideas within an innovation framework. It features a robust user authentication system and an idea submission engine with file attachment support.

## Key Features

- **User Authentication**: Secure registration and login using JWT (JSON Web Tokens).
- **Role-Based Access Control (RBAC)**: Distinct permissions for `submitter` and `admin` roles.
- **Idea Submission**: Authenticated users can submit project ideas with:
    - Title, Description, and Category.
    - Single file attachment support (stored securely in `uploads/`).
- **Personal Dashboard**: Users can view and manage their own submissions.
- **Admin Overviews**: Restricted access to administrative summaries.

## Tech Stack

- **Backend**: [FastAPI](https://fastapi.tiangolo.com/) (Python 3.12)
- **Database**: [SQLAlchemy](https://www.sqlalchemy.org/) with SQLite (local development)
- **Validation**: [Pydantic v2](https://docs.pydantic.dev/latest/)
- **Security**: [Passlib](https://passlib.readthedocs.io/) (bcrypt) & [PyJWT](https://pyjwt.readthedocs.io/)
- **Package Manager**: [uv](https://github.com/astral-sh/uv)
- **Testing**: [pytest](https://docs.pytest.org/) with [coverage](https://coverage.readthedocs.io/)

## Getting Started

### Prerequisites

- Python 3.12+
- [uv](https://github.com/astral-sh/uv) installed.

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/senademirbas/Innovat-EPAM-Portal.git
   cd Innovat-EPAM-Portal
   ```

2. Sync dependencies:
   ```bash
   uv sync
   ```

### Running the Application

Start the development server:
```bash
uv run fastapi dev src/app/main.py
```
The API will be available at `http://127.0.0.1:8000`.

### API Documentation

FastAPI provides automatic interactive documentation:
- **Swagger UI**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **ReDoc**: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)

<img width="1375" height="827" alt="image" src="https://github.com/user-attachments/assets/a0cea522-05ff-4397-b602-567c65072a66" />

## Testing

Run the integration test suite:
```bash
uv run pytest -v
```

Generate a coverage report:
```bash
uv run pytest --cov=src --cov-report=term-missing
```

## Project Structure

- `src/app/api/`: API endpoints and routing.
- `src/app/core/`: Security and configuration logic.
- `src/app/crud/`: Database operations (Create, Read, Update, Delete).
- `src/app/models/`: SQLAlchemy database models.
- `src/app/schemas/`: Pydantic data schemas for validation.
- `tests/`: Integration and unit tests.
- `uploads/`: Local storage for idea attachments.
