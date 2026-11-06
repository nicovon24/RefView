# Application owner task contracts

Task status lives only in [`../../specs/tasks.md`](../../specs/tasks.md).

## RV-006A - Application runtime and owner admission

- Requirements: OWN-REQ-001..003.
- Dependency: independently reviewed owner contract.
- Deliver runtime validator/connector, explicit bootstrap, read-only status, shared transactional owner guard, and application-only actions.
- Evidence: TDD for runtime and PostgreSQL authority/expiry; independent security and persistence review.

## RV-006B - Deletion, purge, and browser acceptance

- Requirements: OWN-REQ-004..005.
- Dependency: RV-006A.
- Deliver transactional self-delete, bounded server-only purge, Profile privacy surface, and actual browser verification.
- Evidence: PostgreSQL child-order, rollback, lock, repeat and live-owner tests; Playwright CLI reload, separate profile, deletion, expiry and locale checks; independent review.

## Feature integration

Each future save, assessment, Community, and simulator mutation must use the shared owner guard, add its rows to deletion/purge, and receive its own PostgreSQL and independent review before becoming usable.
