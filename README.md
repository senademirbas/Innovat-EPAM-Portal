# 🚀 InnovatEPAM Portal

![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi&logoColor=white)
![Python](https://img.shields.io/badge/python-3670A0?style=for-the-badge&logo=python&logoColor=ffdd54)
![SQLAlchemy](https://img.shields.io/badge/SQLAlchemy-D71F00?style=for-the-badge&logo=sqlalchemy&logoColor=white)
![Pytest](https://img.shields.io/badge/pytest-%23C90000.svg?style=for-the-badge&logo=pytest&logoColor=white)

InnovatEPAM Portal is an enterprise innovation platform built to manage engineering project ideas within EPAM. It demonstrates a full Spec-Driven Development (SDD) lifecycle, moving from raw submissions to administrative evaluation and actionable task assignment.

---

## 🛠 Features

### 🔐 User Authentication & RBAC
- **Multi-Role Security**: Distinct permissions for `submitters` and `admins`.
- **JWT Auth**: Zero-session stateless security with password hashing.
- **Privacy First**: Submitters can only manage their own ideas, while admins have global visibility.

### 💡 Idea Submission & Discovery
- **Rich Forms**: Support for Titles, Categories, Tags, and specialized Problem/Solution statements.
- **Secure Attachments**: Support for file uploads per submission, safely handled via UUID naming.
- **Innovation Feed**: Tabbed views with custom empty-state messaging and real-time status indicators.

### 🗓 Interactive Workspace (New)
- **Central Calendar**: Maps ideation onto a timeline. View ideas, events, and tasks in a unified desk view.
- **Rich Task Management**: Tasks support detailed descriptions, tags, and time-spans (start/end) with status tracking.
- **Day View Drawer**: Click any calendar date for a sliding breakdown of all ideas and todos for that specific day.

### 🔔 Personalized Notifications (New)
- **Event-Driven**: Immediate alerts when an idea is evaluated or a task is assigned.
- **Zero-Refresh**: Frontend polling ensures you stay updated without reloading the dashboard.
- **Dynamic Badge**: Visual indicators for unread alerts.

### ⚖️ Professional Admin UX
- **Redesigned Review Sidebar**: A modern sidebar for evaluating ideas with clear visuals and feedback loops.
- **Task Assignment**: Admins can assign workspace tasks directly to specific users.
- **Dashboard Metrics**: Performance charts (Chart.js) tracking success rates and submission trends.

---

## 🏗 Phases of Development

1.  **Foundation**: Scalable FastAPI architecture with `uv` and SpecKit SDD.
2.  **Auth & Roles**: Secure JWT-based RBAC system.
3.  **Ideation Engine**: Attachment-capable submission pipeline.
4.  **Admin Workflow**: Status lifecycle management and evaluation feedback.
5.  **Workspace**: Calendar integration and context-aware Day View drawers.
6.  **Real-Time**: Notification engine for cross-role collaboration.
7.  **Verification**: 44 integration tests achieving **91% code coverage**.

---

## 🚀 Getting Started

### Prerequisites
- Python 3.12+
- [uv](https://github.com/astral-sh/uv)

### Installation & Run
```bash
# 1. Clone
git clone https://github.com/senademirbas/Innovat-EPAM-Portal.git
cd Innovat-EPAM-Portal

# 2. Setup
uv sync

# 3. Dev Run
uv run fastapi dev src/app/main.py
```

### API Docs
- **Swagger UI**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

<img width="1375" height="827" alt="image" src="https://github.com/user-attachments/assets/a0cea522-05ff-4397-b602-567c65072a66" />

---

## 🧪 Testing
```bash
# Run tests with coverage
uv run pytest --cov=src --cov-report=term-missing
```

**Final Stability**: 44/44 Passed | 91% Coverage

---
**Course**: Advanced Agentic Coding - EPAM Project
**Developer**: senademirbas
