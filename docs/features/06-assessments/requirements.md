# Assessments foundation

Status is tracked only in [`../../specs/tasks.md`](../../specs/tasks.md).

**Delegated SDD.** Assessment content reuses versioned rules, facts, publication, ownership, and deterministic evaluation rather than creating a second scoring authority.

## Objective

Deliver structured bilingual practice with rule questions, restart/discipline decisions, authored incident analysis, reasoned corrections, and targeted next practice.

## Observable acceptance

- **ASM-REQ-001:** Users select only published exercises by available topic, level, and rules edition; unavailable combinations are explicit.
- **ASM-REQ-002:** The reviewed starter set includes a rule question, restart/discipline decision, and authored-incident analysis.
- **ASM-REQ-003:** Server-side deterministic evaluation uses immutable item/rubric versions and accepts wrong but valid answers for correction.
- **ASM-REQ-004:** Required short reasoning uses explicit rubric dimensions; unscored text is labelled unscored and AI does not invent an authoritative grade.
- **ASM-REQ-005:** Corrections connect answer, evidence, rule reference, and available next practice while preserving the initial answer.
- **ASM-REQ-006:** Answer keys/corrections remain private during the attempt; owned results finalize idempotently with provenance.

## Limits

- No certification, proctoring, instructor assignments, or high-stakes examination claims.
- A text assessment does not pretend to measure simulator positioning or perception.
