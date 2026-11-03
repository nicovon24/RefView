# Later simulator expansion task contracts

## RV-070 - Expand the reviewed scenario catalog

- Requirements: all CAT requirements.
- Dependencies: RV-017. May proceed opportunistically alongside wider product work but does not block it.
- Deliver: a separately frozen numeric case list and topic/difficulty/role coverage matrix, followed by scenario-sized assignments.
- Acceptance: per-case schema/projection/checksum tests, evidence captures, sources/licences, Nicolas review, and honest filtered variety.

## RV-071 - Multi-incident authored sequence

- Requirements: MUL-REQ-001, MUL-REQ-002, EXP-REQ-001.
- Dependencies: RV-014, RV-070, and independently reviewed multi-decision contract extension.
- Deliver: one bounded several-minute sequence with explicit actor/time budget and multiple related decisions.
- Acceptance: event/decision order, secrecy, immutable decisions, effects exactly once, persistence/concurrency/reload, replay checksum, full browser run, performance, and visual review.

## RV-072 - Expansion acceptance and autonomous-research decision

- Requirements: all requirements in this feature.
- Dependencies: RV-071 and user-demand evidence.
- Deliver: representative stress/acceptance record and a proceed/defer ADR for any autonomous-match research, including maximum scope and success/failure criteria.
- Limit: `defer` is a valid completed result. This ticket does not start autonomous-match implementation.
