# Decision and evaluation contract

## Initial decision

```ts
type InitialDecision = Readonly<{
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

Validation examples:

- Valid: `stopPlay=true`, `restart=penaltyKick`, `discipline=none`, offender `defence-04`.
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
- Communication initially scores authored inputs such as whistle timing and selected signal; it does not pretend to analyze speech.
- Protocol is `notApplicable` for the initial main-referee/no-VAR task.
- Reason codes and debrief copy are versioned; AI output cannot alter any result.

The client displays returned results but does not calculate the authoritative evaluation.
