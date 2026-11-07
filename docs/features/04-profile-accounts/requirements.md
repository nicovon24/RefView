<a id="07-profile-preferences"></a>

<a id="07-profile-preferences--profile-and-preferences"></a>
## Profile and preferences

Status is tracked only in [`../../specs/tasks.md`](../../specs/tasks.md).

**Delegated SDD where identity/privacy changes.** Preferences and owned history begin anonymously; accounts are optional and require a separate reviewed design.

<a id="07-profile-preferences--observable-acceptance"></a>
## Observable acceptance

- **PRO-REQ-001:** Locale and supported accessibility/input/camera/motion/quality preferences survive reload within their declared owner/device scope; invalid values safely fall back.
- **PRO-REQ-002:** History exposes only the current owner's attempts, exact content versions, and separate evaluation dimensions.
- **PRO-REQ-003:** Topic/edition progress uses documented derivations and never converts missing, unscored, or `notApplicable` results into success.
- **PRO-REQ-004:** Saving/unsaving available content is idempotent and owner-bound; retired/unavailable targets show explicit states.
- **PRO-REQ-005:** Optional anonymous-to-account attachment is explicit, atomic, idempotent, and cannot claim another owner's records.
- **PRO-REQ-006:** Retention and supported deletion are understandable; effects on public contributions/aggregates are explicit before public release.

<a id="07-profile-preferences--limits"></a>
## Limits

- Anonymous cookies are not cross-device identity and may be lost.
- Accounts, email providers, social login, and paid auth services are not implied.
- No invented overall referee grade.

---

<a id="18-application-owner"></a>

<a id="18-application-owner--application-anonymous-owner"></a>
## Application anonymous owner

Status is tracked only in [`../../specs/tasks.md`](../../specs/tasks.md).

<a id="18-application-owner--objective"></a>
## Objective

Admit a private anonymous owner in the application PostgreSQL database so future Academy saves, assessment attempts, Community interactions, and simulator attempts can be authorized consistently. This feature alone creates no public content or completed attempt.

<a id="18-application-owner--observable-acceptance"></a>
## Observable acceptance

- **OWN-REQ-001:** Application configuration rejects test databases, isolated test mode, invalid origins, and missing configuration without fallback.
- **OWN-REQ-002:** Explicit same-origin bootstrap creates an empty seven-day owner, reuses a valid owner without renewal, and reveals no token or internal ID.
- **OWN-REQ-003:** Private owner reads and feature mutation guards use PostgreSQL wall time and owner-row locking; missing, invalid, expired, or other owners cannot access records.
- **OWN-REQ-004:** Same-origin self-delete removes all current owner data transactionally. Bounded server-only purge removes expired owners without touching live owners or canonical content.
- **OWN-REQ-005:** Browser checks prove cookie transport, reload, isolation across profiles, deletion, and bilingual empty/error states. PostgreSQL tests prove rollback, lock and expiry, and deletion order.

<a id="18-application-owner--boundaries"></a>
## Boundaries

- Follow [`../../contracts/application-lifecycle.md#application-anonymous-owner-v1`](../../contracts/application-lifecycle.md#application-anonymous-owner-v1). No accounts, public Community posts, published content, deployment, or operational retention claim is part of this foundation.
- Existing isolated session transport remains test-only. Application mutations cannot use its connector.
- No owner token, digest, or internal ID reaches a client projection or log.

<a id="18-application-owner--route-choice"></a>
## Route choice

Delegated SDD: runtime validation and private owner persistence can be independently implemented after the reviewed contract. The coordinator owns shared configuration, migration validation, routes, integration, and tracker; independent review covers authority, privacy, persistence, and final acceptance.

---

<a id="22-google-account-link"></a>

<a id="22-google-account-link--google-account-and-owned-learning-data"></a>
## Google account and owned learning data

Status is tracked only in [`../../specs/tasks.md`](../../specs/tasks.md).

<a id="22-google-account-link--objective"></a>
## Objective

Add Google sign-in and explicitly attach the current private anonymous learning data to a durable RefView account. Preserve the existing Assessment attempt, submission, result, and finalization identities. The account must make owned Assessment and saved Academy data available on another signed-in device.

Nicolas selected Google as the first account method on 2026-11-06. This is a new explicit account need under PRO-REQ-005/006; older product notes that defer accounts describe the prior scope. The three approved Assessment drafts remain unpublished until their separate trusted publication gate passes.

<a id="22-google-account-link--observable-acceptance"></a>
## Observable acceptance

- **GAC-REQ-001:** A configured Google sign-in completes through a verified provider callback and creates or resumes a private RefView account. Missing credentials, mismatched origin, failed provider verification, and an unavailable database fail closed. No caller-supplied email, Google subject, account ID, or owner ID grants identity. A matching verified email from a different provider identity never links accounts automatically.
- **GAC-REQ-002:** Attachment requires a valid current anonymous cookie and a separate authenticated account session, an explicit user action, and exact same-origin mutation authorization. It is atomic, idempotent for the same account and source, and rejects a second account without disclosing its identity. Old anonymous credentials cannot access or delete attached data after commit.
- **GAC-REQ-003:** Account sessions are individually revocable. Two signed-in devices see the account's same owned Assessment attempts and eligible exact-version Academy saves. A new attempt writes to one stable account primary owner bucket, created atomically on the first account-owned write if none exists. Google sign-in without an anonymous cookie works from an empty account. Existing attempt IDs and their owner IDs, answer bytes, evaluation, hashes, and timestamps remain unchanged.
- **GAC-REQ-004:** Finalize, restore, history, save, unsave, and next practice authorize through account membership at the data source. History pagination remains stable across owner buckets. Visible duplicate saves collapse by exact lesson identity, and account-wide unsave removes all matching bucket saves atomically. An auth lookup failure never falls back to an anonymous cookie.
- **GAC-REQ-005:** Unattached owners retain the existing seven-day expiry and purge. Attached data follows an explicit account retention policy and is excluded from anonymous purge. Account deletion revokes sessions, removes stored Google tokens, and removes every attached owner's descendants transactionally; logout removes only that device's credential. Any retained account data and deletion effect are explained in ES/EN before attachment.
- **GAC-REQ-006:** Restricted PostgreSQL grants, lock ordering, and retry receipts cover attachment against expiry, purge, owner deletion, account deletion, and concurrent retries. The public Assessment catalog still excludes drafts; the private answer key remains absent from active attempts, and deterministic scoring remains provider independent.

<a id="22-google-account-link--limits-and-dependencies"></a>
## Limits and dependencies

- No automatic merge by matching email, automatic anonymous attachment on OAuth callback, Google access to RefView attempt data, or public profile identity.
- No account data migration may bypass the existing Assessment attempt owner immutability or finalization guards.
- Google OAuth client credentials and exact callback registration are external configuration. The application can be prepared locally, but a live Google flow cannot be accepted without them.
- RV-052's published-lesson save acceptance and RV-041..044's trusted Assessment publication and real positive browser journey remain separate gates.
- This identity and persistence work requires independent read-only contract and implementation review. The repository's deterministic behavior policy requires PostgreSQL evidence before marking it verified.
