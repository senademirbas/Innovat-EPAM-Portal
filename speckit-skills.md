# GitHub Copilot SpecKit Skills

This document describes how to leverage the **Spec-Driven Development (SDD) SpecKit** configured within this repository using GitHub Copilot Chat in VS Code.

## Workflow Overview

The SpecKit process separates development into predictable, distinct steps utilizing specialized Copilot Agents:
1.  **Specify:** Turn an idea into a rigorous technical specification (`spec.md`).
2.  **Plan:** Formulate architecture and design modifications based on the specification.
3.  **Tasks:** Generate a step-by-step checklist of actionable tasks.
4.  **Implement:** Implement the tasks sequentially to ensure accuracy and limit AI hallucinations.

## Activating the Agents (VS Code Copilot Chat)

Because SpecKit agents are simply well-structured Markdown prompts, you invoke them by linking the respective file in the GitHub Copilot Chat using the `#file` syntax.

### 1. Specification Phase
**Goal:** Define Requirements, Success Criteria, and Edge Cases.
**Command:** 
> `#file speckit.specify.agent.md` [Your Feature Description]
*Example:* `#file speckit.specify.agent.md` "Add a daily digest email notification for pending evaluation ideas."

*Output:* This agent will generate or update a `spec.md` file under the `specs/` directory based on your idea. Note: Sometimes the agent requires manual confirmation if a branch is missing, but Copilot will guide you.

### 2. Planning Phase
**Goal:** Create a technical footprint of what files need altering.
**Command:** 
> `#file speckit.plan.agent.md` Formulate a technical plan for the {feature_name} spec.

*Output:* Analyzes the `spec.md` and generates an `implementation-plan.md` detailing architecture variations and file locations.

### 3. Tasking Phase
**Goal:** Break the implementation plan into granular, checkable steps.
**Command:** 
> `#file speckit.tasks.agent.md` Turn the current plan into a task checklist.

*Output:* Creates a `tasks.md` checklist containing small increments to prevent Copilot from becoming overwhelmed.

### 4. Implementation Phase
**Goal:** Write actual code.
**Command:** 
> `#file speckit.implement.agent.md` Please implement Task 1 from the checklist.

*Output:* Copilot will generate the exact code changes and terminal commands (like tests) needed to satisfy the checklist step. Continue asking for subsequent tasks (e.g., "Implement Task 2") until the checklist is complete.

## Why use this workflow over general prompts?

- **Traceability:** Every decision is mapped to a requirement in the `spec.md`.
- **Modularity:** Limits AI context overload by focusing only on one task at a time.
- **Maintainability:** You are always left with documentation (Specification, Plan, and Task Checklist) explaining *why* code was written, instead of just the generated code itself.

---

## 🌐 skills.sh Ecosystem Compatibility

This project supports the **skills.sh** (Agent Skills Directory) standard for advanced AI agents, making the workflows native to the broader Vercel AI ecosystem and `skills.sh` compatible tools.

### 1. SKILL.md Standard
The project includes a `.agents/workflows/SKILL.md` file. Modern AI agents connecting to this repository will automatically detect the "InnovatEPAM SDD Workflow" skill, learning how to execute the SpecKit SDD process dynamically without manual `#file` prompting.

### 2. Terminal Agent Execution
If you use CLI-based agent frameworks compatible with `skills.sh`, they can interact with the project natively using the PowerShell modules defined in `.specify/scripts/powershell/` (e.g., `create-new-feature.ps1`).

**To run the skills framework via CLI:**
```bash
# If using a skills.sh compatible CLI agent
npx @skills/cli run speckit.specify "Add user notification system"
```

*(Note: While the project structure supports the `skills.sh` philosophy by defining discrete AI skills (Specify, Plan, Task, Implement), Copilot users can stick to the `#file` syntax described above for a completely native VS Code experience).*
