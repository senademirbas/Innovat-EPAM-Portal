---
name: "InnovatEPAM SDD Workflow"
description: "Executes the Spec-Driven Development (SDD) process natively via GitHub Copilot and CLI tools. Manages spec creation, planning, and task generation."
---

# InnovatEPAM SDD Workflow

This skill equips your AI Assistant (like GitHub Copilot) with the ability to orchestrate the Spec-Driven Development workflow directly within the InnovatEPAM Portal.

## Capabilities

The agent can perform the following steps by invoking the corresponding prompt files:

1.  **Specify (`speckit.specify`):** Generate a full technical specification.
2.  **Plan (`speckit.plan`):** Convert the specification into an architecture implementation plan.
3.  **Tasks (`speckit.tasks`):** Break down the plan into a checklist of actionable steps.
4.  **Implement (`speckit.implement`):** Execute the checklist step-by-step.

## Agent Instructions

When interacting with this skill, you must:

1.  Ask the user what phase of the SDD process they want to initiate.
2.  Use the corresponding `.github/agents/{agent_name}.agent.md` file to formulate your responses and actions.
3.  If executing commands natively via terminal, utilize the tools in `.specify/scripts/powershell/` (e.g., `create-new-feature.ps1`).

## Example Usage

### Via Copilot Chat
Provide instructions based on the existing agents in `.github/agents/`.

```markdown
User: Let's start the specify phase.
Assistant: I will now load the `#file speckit.specify.agent.md` instructions and help you draft the `spec.md`...
```

### Via CLI (`skills.sh` Compatible)
The project supports dynamic shell standard capabilities.
To manage features from the terminal using PowerShell:

```powershell
./.specify/scripts/powershell/create-new-feature.ps1 "Feature Description" -ShortName "feature-name"
```
