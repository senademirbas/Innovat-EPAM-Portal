# ADR-001: Technical Stack Selection

## Status
Accepted

## Context
We need to build the InnovatEPAM Portal MVP (Phase 1) with a focus on speed, safety, and modern Python standards. The project requires authentication, file uploads, and a relational database.

## Decision
We chose the following stack:
- **Language**: Python 3.12 (Modern features, type hinting)
- **Web Framework**: FastAPI (High performance, async support, auto-generating documentation)
- **Package Manager**: `uv` (Extremely fast dependency management and execution)
- **Database**: SQLite with SQLAlchemy (Easy setup for local development, robust ORM)
- **Testing**: `pytest` with `pytest-cov` (Standard testing utility)
- **Code Quality**: `ruff` (Fast and comprehensive linting/formatting)

## Consequences
- **Positive**: Rapid development cycle, type safety across API layers, fully automated documentation.
- **Trade-offs**: SQLite is not suitable for high-concurrency production but perfect for MVP/Sprint development.
