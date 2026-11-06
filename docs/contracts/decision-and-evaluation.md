# Decision and evaluation contract

## Initial decision

```ts
type InitialDecision = Readonly<{ // canonical persisted record, never the browser DTO
  attemptId: string;
  scenarioRef: ScenarioRef;
  decisionId: string;
  decisionTick: number;
  stopPlay: boolean;
  restart: "playOn" | "penaltyKick" | "directFreeKick" | "indirectFreeKick" | "droppedBall";
  discipline: "none" | "yellow" | "red";
  offenderActorId: string | null;
  confirmedAt: string;
  idempotencyKey: string;
}>;
```

The UI may collect the fields in steps, but confirmation creates one immutable initial decision. A later VAR/final decision is a separate record linked to it; it never overwrites the initial choice.

The challenge transport uses `offenderActorHandle`, an opaque public actor handle. For a non-null choice, the server resolves it through the pinned scenario's private canonical-to-public mapping and stores the canonical `offenderActorId` shown above. Unknown handles and submitted canonical IDs fail. The normalized canonical decision, not the untrusted handle string, enters the finalization digest and evaluation. Owner-bound public attempt views convert the canonical ID back to its public handle.

The browser presentation workflow may retain only the exact public transport choice and its pinned public roster. It must copy/freeze the choice on confirmation. An uncertain finalization failure keeps that choice and its idempotency key for an identical retry or owner-bound restoration; it cannot allow editing a possibly committed initial decision. The server remains the sole authority for canonical normalization and evaluation.

Validation examples:

- Valid browser choice: `stopPlay=true`, `restart=penaltyKick`, `discipline=none`, and an offender handle from the pinned playable roster such as `actor-006` (the server resolves the handle before storing a canonical actor ID).
- Valid incorrect answer: `stopPlay=false`, `restart=playOn`, `discipline=none`. It must be accepted and evaluated, not rejected as malformed.
- Invalid: `stopPlay=false` with `restart=penaltyKick`.
- Invalid: a discipline choice with an actor not in the scenario.
- Invalid: a decision tick outside the permitted decision window.

## Deterministic evaluation

The server evaluates a finalized decision and a server-recomputed observation summary against the immutable private rubric for the exact scenario version. It validates the bounded view/input trace against tick order, movement constraints, and the canonical scenario before deriving observation; it does not trust a client-supplied score or confidence band.

```ts
type DimensionResult = Readonly<{
  status: "scored" | "notApplicable" | "insufficientEvidence";
  score: number | null; // integer 0..100 only when scored
  reasonCodes: readonly string[];
  evidenceIds: readonly string[];
}>;

type EvaluationResult = Readonly<{
  evaluationVersion: number;
  decisionQuality: DimensionResult;
  observationAndPositioning: DimensionResult;
  communication: DimensionResult;
  protocolApplication: DimensionResult;
  debriefContentId: string;
}>;
```

Rules:

- Dimensions remain separate. The first MVP has no authoritative aggregate score.
- `notApplicable` is not converted to 100 or 0.
- Decision quality uses answer-key alternatives appropriate to `clear`, `interpretative`, or `inconclusive` content.
- Observation uses only eligible live evidence, not replay or final-answer correctness.
- Communication can score authored inputs such as whistle timing and selected signal after those inputs and their timing contract exist; it does not pretend to analyze speech. The first synthetic v1 below reports it as `notApplicable` until then.
- Protocol is `notApplicable` for the initial main-referee/no-VAR task.
- Reason codes and debrief copy are versioned; AI output cannot alter any result.

The client displays returned results but does not calculate the authoritative evaluation.

## Initial clear main-referee evaluation v1

The first incident uses a narrow immutable private rubric. This defines a conservative synthetic implementation before rendered-evidence calibration; it does not assign partial-credit weights that have not been reviewed.

```ts
type ClearPenaltyMainRefereeRubricV1 = Readonly<{
  evaluationVersion: 1;
  classification: "clear";
  role: "mainReferee";
  decision: Readonly<{
    mode: "exactSemanticMatch";
    expected: Readonly<{
      stopPlay: true;
      restart: "penaltyKick";
      discipline: "none";
      offenderActorId: string;
    }>;
    allowUnspecifiedOffenderWhenNoCard: true;
    evidenceIds: readonly string[];
  }>;
  observation: Readonly<{
    observationRubricVersion: 1;
    requiredEvidenceIds: readonly string[];
  }>;
  communication: Readonly<{ mode: "notApplicable"; reason: "noAuthoredCommunicationInput" }>;
  protocol: Readonly<{ mode: "notApplicable"; reason: "initialMainRefereeNoVar" }>;
  debriefContentId: string;
}>;
```

Validate exact keys and literal scope, a canonical offender in the pinned roster, nonempty unique evidence IDs contained in the pinned private observation fixture, and an immutable prepared debrief ID for the same scenario version. For the actual `incident-001` publication, the required set must include `EV-TRIP-CONTACT` and `EV-INSIDE-AREA`; the reviewed content gate must also decide whether `EV-NO-BALL-TOUCH` and `EV-NON-DOGSO` are jointly readable enough to require. A synthetic test fixture may use other named evidence, but its scores are not training claims. The authored rubric omits `scenarioContentHash` to avoid a self-referential hash. After source validation, the server binds the rubric to the verified scenario ref and derived content hash; it does not accept a client-supplied bound rubric or observation summary.

Normalize only declared semantic decision fields. `decisionTick` must be a safe integer in the pinned decision gate and equal the server-recorded deciding tick and trace stop tick. `stopPlay` must equal whether `restart` differs from `playOn`. A card requires a non-null known offender handle. Without a card, a null offender is valid; any supplied handle must still resolve to a roster actor. Wrong but structurally valid decisions remain accepted. Unknown handles, submitted canonical actor IDs, client scores/rubrics, and undeclared fields are rejected. Resolve the public handle to the canonical ID before digesting, evaluating, or storing.

Decision quality scores `100` only for stop, penalty kick, no card, and either no offender selection or the expected canonical offender; otherwise it scores `0`. Emit `stopMismatch` when stop differs, `restartMismatch` when restart differs, `disciplineMismatch` when discipline differs, and `offenderMismatch` only when a non-null selected canonical actor differs from the expected actor. Emit codes in that order; a correct decision has no mismatch code. Supporting decision evidence IDs describe authored rationale, not what the referee observed. The server recomputes observation with C2 from the exact pinned trace and private rubric: `none=0`, `weak=40`, `supported=100`, taking the minimum required-evidence band. No eligible live receipt yields `insufficientEvidence` with a null score. A correct guess does not alter observation. Communication is `notApplicable` with null score and `noAuthoredCommunicationInput`; protocol is `notApplicable` with null score and `initialMainRefereeNoVar`. Neither claims a perfect score or voice analysis. `decisionTick` is not a measured whistle/signal input. Evaluation version `1` fixes these rules and reason-code semantics, with no aggregate score.

The approved incident brief includes whistle timing and a clear signal as communication feedback intent. The first synthetic implementation has no authored whistle/signal input distinct from decision confirmation, so it must show that dimension as unavailable instead of awarding a fabricated score. RV-009 may add a separately recorded whistle/signal action and an authored timing rubric; doing so reopens this contract and requires dedicated tests. This deferral does not waive Nicolas's later rendered-evidence review or claim the approved communication feedback is already implemented.
