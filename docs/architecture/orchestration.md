# RefView orchestration workflow

## Objective

Use model orchestration to improve bounded planning, implementation, research, and review without distributing product authority or creating conflicting sources of truth.

## Inspected configuration

- The global Codex configuration declares `gpt-6-luna` with `medium` effort and the default service tier. This is a configured default, not proof of the current runtime identity.
- RefView had no local agent profiles when this workflow was established.
- The sibling `ai-engineering-projects` repository supplied the continuity, SDD, CHECKLOG, ownership, and review pattern. Its instructions do not automatically apply here; the applicable policy is now recorded in RefView's `AGENTS.md`.
- Official OpenAI documentation describes subagents as independent contexts that share the configured environment filesystem; it recommends clear independent tasks and warns that agents editing the same files must coordinate.

## Model routing

| Work class | Requested model | Effort | Typical outputs |
| --- | --- | --- | --- |
| Fundamental | `gpt-6-astra` | `high` | Product boundaries, architecture, domain authority, canonical timeline, scoring semantics, shared contracts |
| Substantial planning | `gpt-6-astra` | `high` | Feature decomposition, acceptance, integration plan, task contracts, planning review |
| Implementation | `gpt-6-sol` | `medium` | Bounded code and tests under exclusive paths |
| Research | `gpt-6-luna` | `high` | Focused official-source or license research informing one decision |
| Independent review | `gpt-6-sol` | `high` | Read-only acceptance, diff, invariant, security, and evidence review |

Use Astra high as the default for planning and coordination. Reserve xhigh for exceptional decisions where the additional reasoning is clearly justified; do not use it for routine decomposition or implementation.

## Observed batching preference

Nicolas wants upcoming implementation batches to conserve model usage while continuing steady progress. Keep each batch centered on one concrete, reviewable outcome; group only tightly related work, and avoid reopening already settled planning or broadening the batch into unrelated tickets. Use Astra high for planning and coordination, reserving xhigh for exceptional decisions where its extra reasoning is justified; use Sol medium/high for bounded implementation and focused review. Report what was completed, what remains, and the evidence so the next batch can resume without repeating work. This is a working preference, not a restriction on Nicolas changing scope.

## Observed foundation planning

| Task | Creation evidence | Requested | Runtime-confirmed | Result |
| --- | --- | --- | --- | --- |
| Fundamental architecture | `collaboration.spawn_agent` returned `/root/foundation_architecture` | `gpt-6-astra`, `xhigh` | unconfirmed | Read-only plan returned; no files changed. |
| Delivery workflow | `collaboration.spawn_agent` returned `/root/delivery_workflow` | `gpt-6-astra`, `high` | unconfirmed | Read-only operating review returned; no files changed. |
| First-incident IFAB research | `collaboration.spawn_agent` returned `/root/incident_research` | `gpt-6-luna`, `high` | unconfirmed | Official-source brief proposal returned; no files changed by worker. |
| Shared-contract architecture | `collaboration.spawn_agent` returned `/root/contract_architecture` | `gpt-6-astra`, `xhigh` | unconfirmed | Read-only contract recommendations returned in progress messages; the task was stopped after the needed findings were received, without file changes. |
| RV-002/RV-003 independent review | `collaboration.spawn_agent` returned `/root/contracts_review` | `gpt-6-sol`, `high` | unconfirmed | Initial `FIX`; seven corrections passed read-only re-review. |
| Simulator backlog planning | `collaboration.spawn_agent` returned `/root/simulator_backlog` | `gpt-6-astra`, `high` | unconfirmed | Read-only RV-012+ requirements/dependency proposal returned; no files changed by worker. |
| Wider-product backlog planning | `collaboration.spawn_agent` returned `/root/product_backlog` | `gpt-6-astra`, `high` | unconfirmed | Read-only Academy/Community/Assessments/Profile/Coach proposal returned; no files changed by worker. |
| Full-product backlog review | `collaboration.spawn_agent` returned `/root/backlog_review` | `gpt-6-sol`, `high` | unconfirmed | Initial `FIX`; three corrections passed read-only re-review. |

The root coordinator's runtime model and effort were not exposed and remain unconfirmed.

## Operating loop

1. **Reconcile:** inspect Git, instructions, product documents, tracker, feature acceptance, code, and CHECKLOG.
2. **Frame:** choose one observable outcome and classify it as direct, SDD light, or delegated SDD.
3. **Specify:** resolve authority boundaries and shared contracts; define `REQ-*`, task dependencies, ownership, tests, and stop conditions.
4. **Make ready:** mark a task `Ready` only when its dependencies and verification are concrete.
5. **Delegate or implement:** use the lowest-complexity path that preserves quality. Keep at most four workers, subject to the runtime's session limit, and disjoint write sets.
6. **Receive:** inspect each handoff, diff, red/green evidence, commands, limitations, and model record before integration.
7. **Integrate:** run focused tests, strict typecheck, lint, build, database checks, and relevant browser flows.
8. **Review:** obtain independent read-only review for delegated work and shared/high-risk boundaries. Re-review affected fixes.
9. **Close:** update the canonical tracker and CHECKLOG with observed evidence. Do not expand completion claims beyond the gate. Leave work local; staging, commits, and pushes require Nicolas's explicit permission for each action.

## Task assignment template

```text
Task and linked REQ IDs:
Objective and observable acceptance:
Baseline branch/commit and relevant local changes:
Resolved dependencies and frozen contracts:
Allowed write paths or read-only scope:
Forbidden/shared paths:
Requested model and effort:
Required checks and expected evidence:
Stop conditions and unresolved decisions:
Return: files changed, acceptance covered, red/green evidence,
commands and observed results, limitations, remaining work,
requested model/effort and runtime-confirmed identity/effort.
```

## Gates

### G0 — Recoverable foundation

Product scope, model policy, task tracker, CHECKLOG, ADRs, and first feature acceptance exist and agree.

### G1 — Reviewed contracts and incident content

Coordinates, clocks, authored content, observation, decision, evaluation, replay, persistence, and localization are specified. The incident has versioned rule sources and a Nicolas review checkpoint.

### G2 — Verifiable core

Workspace, PostgreSQL path, validation, timeline, replay, and persistence have TDD evidence.

### G3 — Playable incident

Movement, adjustable stabilized third-person/first-person cameras, canonical action, and position-dependent evidence work in the running browser.

### G4 — Complete vertical slice

Briefing, play, decision, deterministic debrief, replay, persistence, localization, loading, and error recovery work end to end.

### G5 — MVP acceptance

Playwright CLI and visual inspection verify the declared browser/device; performance is measured; independent review passes; limitations remain explicit.

## Concurrency and ownership

- One coordinator and no more than four active subagents, subject to the runtime's session limit.
- Shared documents, manifests, lockfiles, configuration, and schema coordination have one owner at a time.
- Parallel tasks require disjoint files and resolved contracts. RV-005 timeline work and RV-006 persistence may run in parallel after RV-003/RV-004.
- Do not inspect or edit a worker's actively owned files. Wait for its handoff.
- Neither coordinator nor workers stage, commit, or push without Nicolas's explicit permission for that action. A request to continue implementation is not Git authorization. Workers also do not deploy or update task status.
- After two unsuccessful correction cycles, reduce or redesign the assignment.

## Evidence policy

- A worker's completion statement is a handoff, not acceptance.
- Record commands and observed results, not intended checks.
- Review and test evidence is scoped to a code reference or precise working-tree diff.
- A later relevant edit invalidates affected evidence.
- Runtime model identity remains `unconfirmed` unless the runtime explicitly returns it.

## Official references

- [OpenAI multi-agent guidance](https://developers.openai.com/api/docs/guides/agents-api/multi-agent)
- [OpenAI reasoning-effort guidance](https://developers.openai.com/api/docs/guides/reasoning)
