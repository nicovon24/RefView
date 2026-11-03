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

1. Locks the attempt and validates owner, state, scenario version, and decision gate.
2. Normalizes the finalization payload and calculates its canonical digest.
3. Claims a key unique to `(owner, attemptId, idempotencyKey)` and stores the digest.
4. Validates/persists bounded observation data and recomputes the observation summary.
5. Inserts one immutable initial decision under a database uniqueness constraint for `(attemptId, decisionKind=initial)`.
6. Computes/persists evaluation and moves the attempt to `debrief`.

A retry revalidates the owner before reading the prior result. The same scoped key plus the same digest returns that result; the same key with a different digest is a conflict. Concurrent different keys cannot create two initial decisions: the uniqueness constraint permits one winner, and the other request returns the existing result only when its canonical payload digest matches, otherwise a conflict. IDs or idempotency keys alone never authorize access.

The first MVP requires no account. Anonymous ownership is supported only through a high-entropy, `Secure`, `HttpOnly`, `SameSite=Lax` session cookie and a short retention policy to be fixed in RV-006. Authentication can later attach eligible attempts through an explicit server operation. IDs alone never authorize access.

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
