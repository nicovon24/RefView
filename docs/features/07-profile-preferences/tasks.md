# Profile and preferences task contracts

## RV-050 - Consolidate preference contract and controls

- Requirements: PRO-REQ-001.
- Dependencies: reviewed preference and owner scope; the existing locale route does not require simulator acceptance.
- Deliver: one preference store and precedence model for locale, camera/input, motion, accessibility, and quality.
- Acceptance: validation/fallback/reload/owner-isolation tests and browser checks for every exposed control.

## RV-051 - Owned history and progress foundation

- Requirements: PRO-REQ-002, PRO-REQ-003.
- Dependencies: RV-011.
- Deliver: read-only simulator history against immutable versions plus documented topic/edition derivations. Later features add adapters only after their result contracts pass.
- Acceptance: TDD for ownership, pagination/empty states, separate dimensions, and no invented composite grade.

## RV-052 - Saved content and privacy controls

- Requirements: PRO-REQ-004, PRO-REQ-006.
- Dependencies: RV-022 and a reviewed production owner/deletion contract.
- Deliver: save/unsave available content and declared history/preference deletion with authorization, retention, and retirement behavior.
- Acceptance: PostgreSQL idempotency/ownership tests and independent privacy/persistence review.

## RV-053 - Optional account and anonymous migration

- Requirements: PRO-REQ-005, PRO-REQ-006.
- Dependencies: RV-052 and an explicit product need for cross-device/account continuity.
- Deliver: reviewed authentication/session design and atomic current-session attachment.
- Acceptance: proof of current anonymous session, binding, retry, collision, rollback, and wrong-owner tests. This ticket may remain deferred indefinitely.

## RV-054 - Profile stage acceptance

- Requirements: applicable PRO requirements for the delivered stage.
- Dependencies: RV-050 and RV-052 for the early Profile; RV-044 only if assessment progress is shown. RV-051 remains a later integration after RV-011; RV-053 only for account claims.
- Acceptance: real preferences, eligible saves, privacy controls, honest empty history, and owner isolation pass browser and independent review. A later RV-051 integration review is required before showing simulator history/progress.
