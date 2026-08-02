# Jizoni

**AI-native project controls and scheduling.** A product of hQube LLC.

Jizoni builds the work breakdown structure, runs the critical path, and flags risk in a timeline before it costs a week — real project controls, with an agent that does the analysis a senior planner would do on every update.

Website: [jizoni.com](https://jizoni.com) · Built by: [hQube LLC](https://hqube.co)

## What it does

| Area | Capability |
| --- | --- |
| Scope | Hierarchical WBS editor with generated task breakdowns |
| Schedule | Interactive Gantt, dependency logic, critical path, calendars |
| Control | Baselines with change history, earned value and variance reporting |
| Resources | Assignment, levelling, and allocation recommendations |
| Analysis | Jz-Agent — schedule reasoning, risk flags, and mitigation options |

Jizoni is aimed at engineering and construction programmes where the schedule is a contractual artefact, not a task list — the seat sits beside Primavera P6 and specialist schedule-analytics tooling rather than beside a task board.

## Architecture

React + Vite + Tailwind with shadcn/ui, on Supabase — Postgres, auth, storage, and edge functions. The runtime path is self-contained: there is no third-party application platform between the app and its database.

Multi-tenancy is enforced in Postgres. Every table is scoped to an organisation and protected by row level security, so tenant isolation is a property of the database rather than something the client is trusted to get right. Plan limits (project count, activity count, baselines, agent usage) are enforced by triggers for the same reason.

## Status of this repository

This repository holds early prototype material and reference data from Jizoni's design phase — component sketches, a knowledge-base entity schema, and sample project data.

**It is not the deployed application and should not be used as a starting point.** The production codebase lives in hQube LLC's private infrastructure; the files here predate the current Supabase-backed architecture described above and do not reflect the shipping product's data model, authorization model, or integration surface.

Kept public as a design-history reference only.

## License

Copyright © hQube LLC. All rights reserved.
