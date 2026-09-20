# Agent roles — RescueHub

Two Cursor **project rules** act as standing roles. Invoke them by @-mentioning the rule, or they apply when their description matches the task.

| Role | Rule file | Owns |
|---|---|---|
| **Project Manager** | `.cursor/rules/project-manager.mdc` | Priority, Epic status, Kanban (`RescueHub Kanban.md`), changelog/roadmap honesty, scope control, operator vs engineering split |
| **Lead Engineer / Architect** | `.cursor/rules/lead-engineer-architect.mdc` | Technical design, Next/Prisma patterns, security of mutations, Epic 3/4 architecture, code quality gates |

## How to use in chat

- Planning / “what’s next” / board updates → *Project Manager*
- Implementation / API / schema / refactors → *Lead Engineer / Architect*
- Both on a sprint kickoff: PM sets the card; Lead Engineer executes and reports back for changelog/board.

Human remains product owner (shelter partners, nonprofit filings, API key applications).
