<a id="07-profile-preferences"></a>

<a id="07-profile-preferences--profile-and-preferences-task-contracts"></a>
## Profile and preferences task contracts

<a id="07-profile-preferences--rv-050-consolidate-preference-contract-and-controls"></a>
## RV-050 - Consolidate preference contract and controls

- Requirements: PRO-REQ-001.
- Dependencies: reviewed preference and owner scope; the existing locale route does not require simulator acceptance.
- Deliver: one preference store and precedence model for locale, camera/input, motion, accessibility, and quality.
- Acceptance: validation/fallback/reload/owner-isolation tests and browser checks for every exposed control.

<a id="07-profile-preferences--rv-051-owned-history-and-progress-foundation"></a>
## RV-051 - Owned history and progress foundation

- Requirements: PRO-REQ-002, PRO-REQ-003.
- Dependencies: RV-011.
- Deliver: read-only simulator history against immutable versions plus documented topic/edition derivations. Later features add adapters only after their result contracts pass.
- Acceptance: TDD for ownership, pagination/empty states, separate dimensions, and no invented composite grade.

<a id="07-profile-preferences--rv-052-saved-content-and-privacy-controls"></a>
## RV-052 - Saved content and privacy controls

- Requirements: PRO-REQ-004, PRO-REQ-006.
- Dependencies: RV-022 and a reviewed production owner/deletion contract.
- Deliver: save/unsave available content and declared history/preference deletion with authorization, retention, and retirement behavior.
- Acceptance: PostgreSQL idempotency/ownership tests and independent privacy/persistence review.

<a id="07-profile-preferences--rv-053-optional-account-and-anonymous-migration"></a>
## RV-053 - Optional account and anonymous migration

- Requirements: PRO-REQ-005, PRO-REQ-006.
- Dependencies: RV-052 and an explicit product need for cross-device/account continuity.
- Deliver: reviewed authentication/session design and atomic current-session attachment.
- Acceptance: proof of current anonymous session, binding, retry, collision, rollback, and wrong-owner tests. This ticket may remain deferred indefinitely.

<a id="07-profile-preferences--rv-054-profile-stage-acceptance"></a>
## RV-054 - Profile stage acceptance

- Requirements: applicable PRO requirements for the delivered stage.
- Dependencies: RV-050 and RV-052 for the early Profile; RV-044 only if assessment progress is shown. RV-051 remains a later integration after RV-011; RV-053 only for account claims.
- Acceptance: real preferences, eligible saves, privacy controls, honest empty history, and owner isolation pass browser and independent review. A later RV-051 integration review is required before showing simulator history/progress.

---

<a id="18-application-owner"></a>

<a id="18-application-owner--application-owner-task-contracts"></a>
## Application owner task contracts

Task status lives only in [`../../specs/tasks.md`](../../specs/tasks.md).

<a id="18-application-owner--rv-006a-application-runtime-and-owner-admission"></a>
## RV-006A - Application runtime and owner admission

- Requirements: OWN-REQ-001..003.
- Dependency: independently reviewed owner contract.
- Deliver runtime validator/connector, explicit bootstrap, read-only status, shared transactional owner guard, and application-only actions.
- Evidence: TDD for runtime and PostgreSQL authority/expiry; independent security and persistence review.

<a id="18-application-owner--rv-006b-deletion-purge-and-browser-acceptance"></a>
## RV-006B - Deletion, purge, and browser acceptance

- Requirements: OWN-REQ-004..005.
- Dependency: RV-006A.
- Deliver transactional self-delete, bounded server-only purge, Profile privacy surface, and actual browser verification.
- Evidence: PostgreSQL child-order, rollback, lock, repeat and live-owner tests; Playwright CLI reload, separate profile, deletion, expiry and locale checks; independent review.

<a id="18-application-owner--feature-integration"></a>
## Feature integration

Each future save, assessment, Community, and simulator mutation must use the shared owner guard, add its rows to deletion/purge, and receive its own PostgreSQL and independent review before becoming usable.

---

<a id="22-google-account-link"></a>

<a id="22-google-account-link--google-account-task-contracts"></a>
## Google account task contracts

Status is tracked only in [`../../specs/tasks.md`](../../specs/tasks.md).

<a id="22-google-account-link--account-contract-and-migration"></a>
## Account contract and migration

- Requirements: GAC-REQ-001..006, PRO-REQ-005/006.
- Dependencies: Google as selected account method, the reviewed RV-052 anonymous owner/save contract, and reviewed owner-bucket and retention decisions. RV-052's positive published-lesson browser acceptance remains separate.
- Deliver: pinned auth adapter choice, exact cookie/callback configuration, account/binding/receipt schema, restricted grants, and account-aware purge/deletion contract.
- Acceptance: independent security/privacy/persistence review and PostgreSQL proof of role denial, expiry races, collisions, retries, rollback, and deletion.

<a id="22-google-account-link--account-owned-learning-services"></a>
## Account-owned learning services

- Requirements: GAC-REQ-002..006, ASM-REQ-005/006, PRO-REQ-004/005.
- Dependencies: account migration and identity admission.
- Deliver: explicit current-session attachment, multi-bucket Assessment authorization/history and Academy save list/unsave, with unchanged scoring and immutable attempt bytes.
- Acceptance: PostgreSQL owner-bound behavior, stable pagination, separate device sessions, exact-version deduplication, and independent review.

<a id="22-google-account-link--google-and-browser-journey"></a>
## Google and browser journey

- Requirements: GAC-REQ-001..005.
- Dependencies: server contracts and registered OAuth client for the exact local callback.
- Deliver: ES/EN sign-in, account status, explicit attach, logout, and deletion surfaces.
- Acceptance: browser sign-in/attach/second-device/old-cookie denial/deletion flows; failed configuration and provider errors remain honest; independent final review.
