# Innovat-EPAM-Portal Constitution

## Core Principles

### I. Clean Python Code
Everything we build must adhere to high standards of readability and maintainability.
- **PEP 8 Compliance**: All code must follow the standard Python style guide.
- **Readability**: Code is read more often than it is written. Variable names must be descriptive, and functions should do one thing.
- **Simplicity**: Favor simple, explicit implementations over "clever" or complex ones.

### II. Test-Driven Development (TDD)
The **RED-GREEN-REFACTOR** cycle is mandatory for all feature development.
1. **RED**: Write a failing test for the next bit of functionality you want to implement.
2. **GREEN**: Write the minimal amount of code necessary to pass the test.
3. **REFACTOR**: Clean up the code while ensuring all tests continue to pass.

### III. Testing Pyramid & Quality Gates
We maintain a healthy balance of tests to ensure stability and development speed.
- **Testing Pyramid**:
    - **Unit Tests (70%)**: Fast, isolated tests for individual functions and classes.
    - **Integration Tests (20%)**: Testing the interaction between components (e.g., API to DB).
    - **E2E Tests (10%)**: Testing full user journeys.
- **Quality Gates**:
    - **80% Coverage**: Business logic must maintain at least 80% test coverage at all times.

### IV. Core Technology Stack
- **Backend Framework**: [FastAPI](https://fastapi.tiangolo.com/)
- **Testing Framework**: [pytest](https://docs.pytest.org/)

## Governance
This constitution supersedes all other documentation and local practices. Any deviations must be justified and documented.

**Version**: 1.0.0 | **Ratified**: 2026-02-24
