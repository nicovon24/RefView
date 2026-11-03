# RV-002/RV-003 documentation review

- Review date: 2026-11-02.
- Scope: incident brief, shared contracts, testing strategy, task contracts, tracker/CHECKLOG consistency, and authority boundaries.
- Requested reviewer model/effort: `gpt-6-sol` / `high`.
- Runtime-confirmed model/effort: `unconfirmed`.
- Mode: independent, read-only; the reviewer changed no files.

## First review findings

The initial verdict was `FIX`:

1. RV-002 required a rendered scene before verification even though RV-008, which creates that scene, depended on RV-002.
2. Task text still attributed the later rendered checkpoint to RV-002 after the first correction.
3. Semantic evidence IDs and canonical offence payloads could leak the answer through the playable projection.
4. Retry/idempotency semantics did not require owner validation on every request, a canonical payload digest, or protection against concurrent different keys.
5. Scenario content was called immutable while review/retirement status lived inside the same record.
6. Server Action wording assumed authenticated accounts despite the anonymous no-account MVP.
7. RV-006/RV-008 task contracts had not yet incorporated scenario publication and the approved-brief dependency.

## Corrections

- Split Nicolas's RV-002 authoring-brief approval from RV-008/RV-011 rendered-evidence acceptance.
- Defined an exact challenge-safe playable projection with opaque cue IDs and negative leakage fixtures.
- Required owner validation before every retry, owner/attempt-scoped keys, canonical payload digests, transactional finalization, and a unique initial decision.
- Separated immutable `ScenarioVersion` content from audited `ScenarioPublication` lifecycle.
- Aligned authenticated and anonymous-session ownership language.
- Updated RV-006 publication tests, RV-008 dependencies, tracker, and task contracts.

## Re-review result

**PASS.** The reviewer reported no remaining contract findings after the corrections.

Observed evidence:

- Coordinates and 60 Hz tick chronology agree across the brief and contracts.
- The proposed IFAB 2026/27 penalty/no-card interpretation is source-backed and explicitly awaits Nicolas's approval.
- Public/private content, scoring authority, anonymous ownership, transactional retries, and scenario publication boundaries are consistent.
- All local Markdown links resolved.
- Tracker and CHECKLOG agree.
- `prompt.md` remained zero bytes and untouched.

## Open acceptance

RV-004 remains `Planned`. Nicolas must approve or correct the RV-002 authoring brief; only then can RV-002 become `Verified`, RV-003 freeze, and RV-004 move to `Ready`. This review does not validate an application or rendered scene.
