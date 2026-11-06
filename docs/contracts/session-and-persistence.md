# Session, state, and persistence contract

## Session plan

```ts
type SessionPlan = Readonly<{
  sessionPlanId: string;
  planVersion: number;
  seed: string;
  owner: Readonly<{ kind: "user"; userId: string }> | Readonly<{ kind: "anonymous"; sessionId: string }>;
  locale: "es" | "en";
  role: "mainReferee" | "assistantReferee" | "var";
  competitionProfileId: string;
  items: readonly Readonly<{
    order: number;
    scenarioRef: ScenarioRef;
    transitionFromPrevious: null | Readonly<{
      fromMatchMs: number;
      toMatchMs: number;
      reason: "authoredTimeJump";
    }>;
  }>[];
}>;
```

The first MVP plan has one item. Later composition may filter a reviewed catalog by requested duration, topic, difficulty, role, edition, and competition profile. A seed plus catalog snapshot must reproduce the same plan. The UI must not claim unavailable variety.

## Attempt state machine

```text
created -> loading -> briefing -> ready -> playing <-> paused
playing -> deciding -> finalizing -> debrief <-> replay -> completed
loading|playing|finalizing -> recoverableError -> previous safe state
created|loading|briefing|ready|paused -> abandoned
```

Only server-confirmed finalization enters `debrief`. Replay is unavailable before that transition. The MVP restores completed attempts. A reload during active play returns the same unfinalized attempt to `ready`, clears its uncommitted observation buffer, and restarts the canonical scenario at tick `0`; it does not attempt frame-by-frame mid-play recovery.

### Main-referee presentation adapter boundary (RV-005 recovery)

The XState machine is a presentation adapter. Construct it from an owner-bound public attempt binding: nonempty attempt ID, safe nonnegative run revision, exact `sha256:` plus 64 lowercase hex scenario content hash, `0..480` scenario duration, finite ordered referee field bounds, decision gate satisfying `0 <= opens <= closes <= forcePause <= duration`, and the complete public actor-handle roster derived from the pinned playable projection. Handles are unique and match `^actor-[0-9]{3}$`. The binding also carries `entryState: "new" | "activeRecovery" | "finalizedRecovery"` from an owner-bound server read; this is presentation routing data, not client authorization. The server, not the machine, establishes ownership and authored spawn. All nested initializer data is copied and frozen before the machine retains it. A run-start response has exact fields `{ attemptId, runRevision, scenarioContentHash, initialView }`, matches the binding, and contains an exact tick-zero `ViewSample` satisfying the same C1 framing limits and field bounds used by C2. The response is copied and frozen; neither caller mutation nor mutation through an actor snapshot may change a future transition.

The machine's confirmed decision is the **public transport shape** `{ decisionTick, stopPlay, restart, discipline, offenderActorHandle }`. It never stores canonical `offenderActorId`, private evidence, a rubric, or a score. Strict validation rejects undeclared fields, nonfinite/unsafe ticks, unknown public handles, impossible stop/restart combinations, invalid enum strings, and a card without a selected offender. Structurally valid wrong football decisions remain valid submissions. The server resolves the handle and performs authoritative normalization against the pinned attempt, deciding tick, and C2 stop tick.

`SERVER_DECIDING_CONFIRMED` has exact fields `{ attemptId, runRevision, tick }`. The adapter accepts it only from playing when identity/revision match and the safe integer tick is inside the bound gate and duration. `CONFIRM_DECISION.decisionTick` must equal that recorded tick. Its idempotency key must be a nonempty string of at most 128 characters, matching the persistence boundary; undeclared choice/event fields fail.

At confirmation, the controller generates one high-entropy idempotency key and seals the current C2 live trace. It stores an immutable submission package `{ choice, idempotencyKey, sealedTrace }` for the lifetime of the attempt. The machine's exact `CONFIRM_DECISION` event carries the public choice and key; it copies and freezes both, while the controller retains the trace. A retry must reuse the same key, choice, and exact sealed trace; neither side reconstructs them from mutable controls. The machine alone proves only choice/key preservation, not end-to-end idempotency. If finalization fails with an uncertain commit outcome, it retains the choice/key and returns from `recoverableError` to `finalizing`. It must not offer a fresh initial decision until the server proves no decision was committed.

`SERVER_FINALIZED` has exact public fields `{ attemptId, runRevision, decisionId, evaluationId, finalizedAt }` with matching attempt/revision, nonempty durable IDs, and a valid canonical ISO timestamp; only finalizing accepts it. `SERVER_RESTORED_FINALIZED` is an owner-bound response accepted from loading only when `entryState="finalizedRecovery"`; it has those same durable fields plus `scenarioContentHash` and `state: "debrief" | "completed"`, all bound to the initializer. It enters the returned state without restarting play. `SERVER_RESTORED_ACTIVE` has exact fields `{ attemptId, previousRunRevision, runRevision, scenarioContentHash, previousState: "playing" | "deciding", state: "ready", tick: 0 }`. Loading accepts it only when `entryState="activeRecovery"`; an active run or its recovery error accepts it only when no durable result exists. The previous revision must equal the current revision, the next revision must be a safe integer exactly one greater, and the hash must match. It clears the discarded run's volatile data only after validation. Recovery responses are produced by owner-validated server operations; spoofing a machine event does not authorize a database mutation or grant observation credit.

## Durable records

- `CompetitionProfile`: immutable settings/version.
- `ScenarioVersion`: immutable content metadata, hashes, sources, and public/private content references.
- `ScenarioPublication`: audited draft/reviewed/retired lifecycle for one immutable version; retirement blocks new attempts only.
- `SessionPlan`: immutable ordered scenario refs and explicit time jumps.
- `Attempt`: owner, plan item, state, started/finalized times, last safe tick, locale, role, client/build metadata.
- `ObservationTrace`: bounded, validated samples or compressed segments plus derived summary and model version.
- `Decision`: immutable initial and later review decisions.
- `Evaluation`: deterministic result and rubric version.

Finalization first resolves the current authenticated or anonymous-session owner; every initial request and retry must pass the same owner check. One PostgreSQL transaction then:

1. Locks the attempt and validates its owner and pinned scenario/run identity.
2. Strictly normalizes the semantic decision and exact bounded trace, then calculates the server-side canonical digest.
3. Checks an existing scoped idempotency claim and completed result **before** active-state validation. A matching digest returns only the prior durable result; a different digest conflicts. A different key may alias the completed result only if its digest matches.
4. For a new finalization, validates the active state, server-recorded deciding transition and decision gate, and current run revision; claims the scoped key.
5. Validates/persists bounded observation data and recomputes the observation summary from the private pinned rubric.
6. Inserts one immutable initial decision under a database uniqueness constraint for `(attemptId, decisionKind=initial)`.
7. Computes/persists evaluation and moves the attempt to `debrief`.

A retry revalidates the owner before reading the prior result. The same scoped key plus the same digest returns that result; the same key with a different digest is a conflict. Concurrent different keys cannot create two initial decisions: the uniqueness constraint permits one winner, and the other request returns the existing result only when its canonical payload digest matches, otherwise a conflict. IDs or idempotency keys alone never authorize access.

The first MVP requires no account. Anonymous ownership is supported only through a high-entropy, `Secure`, `HttpOnly`, `SameSite=Lax` session cookie and the RV-006 retention policy below. Authentication can later attach eligible attempts through an explicit server operation. IDs alone never authorize access.

### RV-006 local persistence baseline

- Anonymous sessions use a server-generated 256-bit random token. PostgreSQL stores only its SHA-256 hash, creation time, and an absolute seven-day expiry. Server code resolves the unexpired session on every operation; the token is never a request body field or a public owner ID. The cookie uses `Secure`, `HttpOnly`, `SameSite=Lax`, `Path=/`, no `Domain`, and a matching maximum age. Anonymous history can be restored only while this cookie and session remain valid. At expiry, owner-bound plans, attempts, decisions, traces, and evaluations are inaccessible and eligible for deletion by an explicit purge operation. The local prototype has no scheduled purge or guaranteed deletion deadline; this must be resolved before production use.
- Durable attempt states are `ready`, `playing`, `deciding`, `debrief`, `completed`, and `abandoned`. Loading, briefing, pause, and presentation errors map to the nearest safe durable state. Starting a run records one immutable `AttemptRunStart` per `(attemptId, runRevision)`, with a server-validated initial view and pinned scenario hash. A guarded server transition from `playing` to `deciding` records the revision and decision tick. Finalization requires this marker and the exact trace stop tick; the client cannot assert transition eligibility.
- Recovery of any unfinalized active run (`playing` or `deciding`) locks the attempt, requires its expected revision, increments the revision once, clears the pending decision marker, and returns to `ready` at tick zero. A repeated stale recovery request fails without incrementing again. A completed/debrief attempt restores its durable result. Recovery and finalization lock the same attempt row.
- The server generates decision ID, confirmation time, and finalization time. The canonical finalization digest is SHA-256 over a stable serialization of pinned scenario/run identity, normalized semantic decision, and the exact validated observation trace. Object keys sort recursively, array order is preserved, finite numbers normalize negative zero to zero, and unknown keys are rejected before digesting. The idempotency key and server-generated values are excluded.
- Publication allows `draft -> reviewed -> retired` only. Review requires a review record and source edition; retirement cannot revert to reviewed without a new scenario version. Every transition increments a checked revision and writes an append-only event with actor, reason, previous/new states, and server time. A reviewed-to-retired transition and new-attempt creation lock the same publication row. Retirement blocks only new attempts; previously pinned attempts may finish. A synthetic reviewed fixture with review metadata and source edition may be used **only in the isolated PostgreSQL test database**. Publishing the actual first incident as training content remains gated on Nicolas's rendered-evidence review.
- The JSON transport boundary rejects payloads above 256 KiB before parsing. C2's per-array limits still apply after parsing. This is a local MVP bound; no longer-session payload promise is made.
- Public reads expose only the challenge-safe scenario projection and permitted owner-bound attempt views. They never return private content references, evidence/rubric definitions, anonymous token hashes, or another owner's attempts.

## Server boundary

- Server Components read durable views.
- Server Actions handle same-origin user mutations such as create plan, start attempt, finalize decision, update preferences, and save content.
- Route Handlers serve streaming/HTTP integrations such as the optional AI provider, webhooks, or telemetry ingestion.
- Zod validates every trust-boundary payload. Prisma models storage; domain types do not import Prisma types.

Invalid:

- Mutating a `ScenarioVersion` used by an attempt.
- Finalizing twice into two decisions.
- Authorizing an attempt solely because the caller knows its ID.
- Saving every rendered frame without a bounded observation contract.
- Entering debrief on the client before the durable transaction succeeds.
