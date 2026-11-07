<a id="07-profile-preferences"></a>

<a id="07-profile-preferences--profile-saved-academy-lessons-v1"></a>
## Profile saved Academy lessons v1

<a id="07-profile-preferences--scope"></a>
## Scope

RV-052 first saves an exact reviewed Academy lesson version for the current private anonymous owner. Assessment saves and account sync are separate work. Device preferences remain in browser storage. Simulator history stays empty until a real owned scored attempt exists.

<a id="07-profile-preferences--storage-and-authority"></a>
## Storage and authority

`SavedAcademyLesson` uses `(ownerId, lessonId, lessonVersion)` as its key and stores the canonical `contentHash` and database `savedAt`. Foreign keys bind the owner to `AnonymousSession` with delete cascade and the exact immutable lesson triple to `AcademyLessonVersion` with delete restriction. The app, reviewer, and PUBLIC roles receive no direct save-table privileges. Migration-owned `SECURITY DEFINER` functions are the only application access: `application_list_saved_academy(tokenHash, limit)`, `application_save_academy(tokenHash, lessonId, version, expectedHash)`, and `application_unsave_academy(tokenHash, lessonId, version)`. Each function resolves the real owner through `application_lock_owner` after acquiring its database lock; no caller-provided owner ID is accepted. Listing and deletion scope every row to that resolved owner. Function grants go only to the app role, with a pinned `pg_catalog` search path and bounded inputs.

Saving requires a preexisting valid owner cookie. The Server Action checks the exact configured Origin and strict input. Within one transaction, lock the owner, verify the published source through the Academy TypeScript reader, derive the hash server-side, and call the narrow save function. That function reacquires the same owner lock, then locks the exact Academy publication and independently checks its reviewed state, unrevoked bound review, source identity, canonical envelope/hash and evidence fields before `INSERT ... ON CONFLICT DO NOTHING`. Source versions are immutable, so the reader's semantic compilation remains valid while the function serializes publication state with retirement or withdrawal. A repeated save keeps its original timestamp. New saves of draft, retired, revoked, unavailable, or corrupt content fail closed at the server read; SQL also rejects structurally invalid published bindings when called directly. An unsave calls the narrow owner-scoped deletion function without publication eligibility; repeated unsave succeeds.

The application save function is migration-owned, has a fixed `pg_catalog` search path, uses an exact publication `FOR UPDATE` lock, and verifies reviewed state, unrevoked bound review, exact source hash/envelope, edition and source identity before inserting. It is distinct from the reviewer-only publication lock. Direct app-role table writes and other-owner reads/deletes are denied. SQL cannot re-run the TypeScript source compiler; the reviewed server service must perform that semantic verification inside the same transaction before the write function, and saved reads must fail closed if a later semantic check fails.

<a id="07-profile-preferences--reads-and-deletion"></a>
## Reads and deletion

Profile performs uncached, bounded owner-scoped reads through the narrow list function with stable ordering. It labels each saved exact version as available, retired, or unavailable; only an exact verified available version receives a link. Generic unavailable text replaces corrupt content. Missing owner, empty list, and read failure are different states. No owner ID, token, digest, or private Assessment material enters client props.

Existing self-delete and purge delete the owner root transactionally. Save rows cascade from that root; PostgreSQL tests must prove rollback, expiry and live-owner preservation. Saves disappear with the seven-day anonymous owner and do not sync across browsers. Deleting the server session leaves device preferences in browser storage; Profile's separate local reset removes them. This is the declared local scope, not a production deletion deadline.

<a id="07-profile-preferences--acceptance-evidence"></a>
## Acceptance evidence

TDD against PostgreSQL covers availability and hash binding, repeated/concurrent save and unsave, cross-owner isolation, malformed/expired cookies, save-versus-retire ordering, retired removable rows, restricted role privileges, and self-delete/purge. Browser acceptance requires lesson save, reload, Profile list, unsave, language and isolated browser profiles. Until a real lesson is published, infrastructure tests cannot close the full usable journey.

Read-only Astra/high architecture advice on 2026-11-04 recommended this Academy-only slice; runtime-confirmed model/effort was unconfirmed. Independent Sol/high review first returned FIX for direct app-table owner exposure and incomplete deletion wording. After the narrow function and device-preference corrections, focused independent re-review returned PASS. Reviewer runtime-confirmed model/effort was unconfirmed. This is a reviewed implementation contract, not persistence acceptance.

---

<a id="18-application-owner"></a>

<a id="18-application-owner--application-owner-design"></a>
## Application owner design

The reviewed v1 boundary is [`../../contracts/application-lifecycle.md#application-anonymous-owner-v1`](../../contracts/application-lifecycle.md#application-anonymous-owner-v1). The independent contract review returned PASS after the DB-clock expiry and normalized DB-target corrections; requested `gpt-6-sol`/high, runtime-confirmed identity unconfirmed.

Runtime config uses `DATABASE_URL` and one exact `REFVIEW_APP_ORIGIN`; the isolated test connector remains separate. The server creates and resolves opaque cookie owners. PostgreSQL supplies creation/expiry and checks expiry after an owner-row lock. Each feature mutation uses the same guard within its own transaction. Self-delete and purge lock owners exclusively before deleting descendants in verified order.

The application may be locally verified before any public feature uses the owner. A future deployment still needs a scheduled purge, monitoring, and a retention policy. Browser behavior for Secure cookies on loopback HTTP is an explicit acceptance check; local HTTPS is used if the target browser cannot transmit them.

No schema change is required for the current `AnonymousSession` model. New feature tables must extend deletion and purge coverage before writing owner data.

<a id="18-application-owner--restricted-owner-lifecycle-bridge"></a>
## Restricted owner lifecycle bridge

The local application runtime will use `refview_app`, without direct `AnonymousSession` or simulator-table mutation grants. A migration-owned, `pg_catalog`-search-path function creates an owner from a validated token hash and database UTC time; existing `application_lock_owner` reads or locks an active owner and checks expiry after lock acquisition. A second function locks by token hash and self-deletes; a bounded third function selects only database-expired owners with `FOR UPDATE SKIP LOCKED`. All return allowlisted status/count data, never owner IDs to a caller. The private delete-by-ID helper is executable only by the definer functions.

Delete simulator descendants in existing dependency order, then delete the root `AnonymousSession`. Assessment descendants must cascade from root deletion: their guards reject a direct child deletion while its owner still exists. Keep publication/source records untouched. Pin database function timezone to UTC because existing expiry columns are `timestamp(3)` without a time zone. Create/revoke/grant atomically, grant only app role EXECUTE on the three public entry points, and deny reviewer/PUBLIC and all direct owner-table mutation.

Before switching the runtime credential, prove create/read/self-delete/purge and denial with actual restricted test logins; cover non-UTC sessions, lock races, finalized Assessment and simulator descendant graphs, repeated calls, rollback, and cookie clearing only after commit. After a reviewed app-database migration, reconnect the app under `refview_app` and repeat Profile browser acceptance. Architecture advice requested Astra/high; runtime-confirmed identity unconfirmed.

---

<a id="22-google-account-link"></a>

<a id="22-google-account-link--google-account-and-owner-bucket-design"></a>
## Google account and owner-bucket design

<a id="22-google-account-link--current-facts"></a>
## Current facts

`AnonymousSession` is both a seven-day bearer credential record and the foreign-key root for Academy saves, Assessment attempts and claims, Community rows, and simulator rows. `AssessmentAttempt.ownerId` is immutable; finalized children reject updates. The local PostgreSQL database already has Assessment attempt, submission, result, and finalization-claim tables. They do not require replacement. The current application owner resolver authorizes one cookie-bound owner and the purge deletes expired roots.

<a id="22-google-account-link--identity-and-storage-decision"></a>
## Identity and storage decision

Use a maintained OAuth/session library for Google's server callback and account sessions, with Prisma/PostgreSQL persistence. Better Auth core and its Prisma adapter are pinned to `1.7.18` in the local dependency manifest as the implementation candidate; their exact generated schema and session behavior still require review before an auth route is enabled. Do not use its anonymous-account plugin to replace the existing `refview_session` contract. With Better Auth, explicitly set `account.accountLinking.disableImplicitLinking: true`, leave `trustedProviders` empty, and verify that a same-email distinct provider identity is rejected. The Google provider's stable subject and library-verified session identify the account; email is display data, never a linking proof. Limit the requested Google scope to basic identity. Keep provider credentials server-only and require an exact configured `REFVIEW_APP_ORIGIN` and callback URI.

Better Auth may persist provider tokens. In pinned `1.7.18`, `account.encryptOAuthTokens: true` covers access and refresh tokens but not the Google ID token. Use account create/update hooks to discard the ID token after callback verification, and a database `idToken IS NULL` constraint as a fail-closed backstop. Keep `storeAccountCookie: false` and set Google's `includeGrantedScopes: false` so a prior broader grant is not silently included. `BETTER_AUTH_SECRET` must be a separately generated 32-byte random value encoded as canonical base64url; generate it with `node -e "process.stdout.write(require('node:crypto').randomBytes(32).toString('base64url'))"`, store it only in server secrets, and keep it stable until a reviewed rotation/re-encryption plan is in place. RefView requests online basic identity only and does not call Google APIs after sign-in. Verify that no token value reaches logs, DTOs, or browser storage and that account deletion removes provider-account rows and encrypted token material. If the pinned version cannot meet these conditions, choose a different reviewed adapter before enabling Google sign-in.

Auth-library-managed user, provider-account, session, and verification tables are separate from a new application-owned `AccountOwnerBinding` and bounded attachment receipt. The binding has one unique owner bucket and one account ID; an account may have several buckets. At most one bucket per account is designated primary for new writes. An account with no owned learning data can have no bucket. Existing content row owner IDs are never updated. The physical `AnonymousSession` name remains temporarily for foreign-key compatibility; its attached rows are account data buckets, no longer anonymous bearer authority.

The server principal resolver checks for an account-session cookie before choosing an anonymous path. A present account cookie, including an empty or malformed value, requires a successful Better Auth database-backed session read; an error or invalid session fails closed. No account cookie permits the existing anonymous path. The verified session token remains server-only and is rechecked by `application_lock_account` under the account row lock inside each account-owned transaction. Feature functions never accept a caller-supplied account ID or Google email as authority.

The Google `(providerId, accountId)` subject pair is unique in both Prisma and PostgreSQL. One primary bucket per account is enforced by a partial PostgreSQL unique index on `AccountOwnerBinding(accountId) WHERE isPrimary`; Prisma cannot express that partial index, so the migration owns it and later schema diffs must preserve it.

The first account-owned write without a primary bucket locks the verified account and atomically inserts an owner root, its unique primary binding, and the feature write. The root receives a random 256-bit token hash whose underlying token is never issued or stored; no anonymous cookie is set. Its nominal seven-day `expiresAt` remains a legacy column and is ignored for account authorization. The updated purge excludes bound roots. Concurrent first writes serialize on the account lock and select the same primary bucket. If an account has no primary when its first valid anonymous owner is attached, that owner becomes primary instead; otherwise it becomes a historical bucket. No account bucket is created merely by visiting or signing in.

The production admission boundary is closed until Google configuration is valid. Never expose an app-callable session issuer accepting a caller-provided account ID or provider subject. The auth library owns session issuance and revocation. RefView reads the validated account session close to each private data operation, then uses membership predicates and owner locks in the data access layer. Route/layout checks are presentation only. The registered local Google redirect URI is exactly `http://127.0.0.1:3000/api/auth/google/callback`. The pinned Google provider's `redirectURI` option sets that same URI for authorization and code exchange. RefView admits only this external callback path, requires its request `Host` to match the configured origin's host, and internally hands its query and request to Better Auth's `/api/auth/callback/google` handler so the library remains responsible for state and code verification. The same-origin sign-in POST additionally requires an exact `Origin` header. The request URL constructed by the local Next.js server can use `localhost` internally even when the browser and configured origin use `127.0.0.1`; this internal URL origin is not the admission authority.

Do not mount Better Auth's unrestricted catch-all handler. Its social sign-in endpoint can accept caller-supplied scopes or an ID token, and account endpoints can return provider token material. The eventual Route Handler must allow only the reviewed Google authorization-code start and callback methods/paths, validate a strict start body with no scopes or ID-token input and exact Origin, and reject every other library endpoint. Account status and logout use reviewed server-side operations with their own authorization. No provider or session token is serialized to a browser response or rendered DTO. Reject `BETTER_AUTH_TRUSTED_ORIGINS` and `BETTER_AUTH_SECRETS` environment overrides so the library cannot silently widen the exact-origin list or replace the reviewed secret configuration.

<a id="22-google-account-link--explicit-attachment-transaction"></a>
## Explicit attachment transaction

The user signs in, then chooses a visible action to attach data from the **current browser's** anonymous session. The Server Action validates exact Origin and strict input, derives both principals from their independent cookies, and takes locks in a documented global order: account, anonymous owner, then any child records. It checks anonymous expiry using database wall time after the owner lock. An exclusive unique binding prevents another account from claiming the owner. The transaction inserts a bounded retry receipt and disables anonymous bearer access to that owner. Only after commit does the action clear the old anonymous cookie. If the response or cookie write is lost, a repeat while signed in to the same account and carrying the old cookie may return the prior success from the receipt, without restoring anonymous feature access. A different destination account receives a generic conflict. Rollback leaves the old owner and data unchanged.

`application_lock_owner`, anonymous deletion, and anonymous save procedures must reject attached owners. This revocation occurs in the same database commit as binding. Anonymous session expiry is not extended. Account-bound access instead checks the authenticated account, membership, and the original bucket. A failure in account session verification is unavailable, never a reason to use the anonymous path.

<a id="22-google-account-link--account-owned-operations"></a>
## Account-owned operations

New Assessment starts use the primary owner bucket. Finalize and restore first prove that the attempt's original bucket belongs to the account, lock that bucket, then use the existing owner-qualified attempt lock and pinned content checks. Finalization claims continue to store the original owner ID. History queries all account buckets, validate the cursor's account membership, and keep the `(startedAt DESC, attemptId DESC)` ordering. Public DTOs still omit internal owner/account IDs and answer keys.

Academy saves keep their existing exact `(ownerId, lessonId, lessonVersion)` uniqueness. Account list views deduplicate `(lessonId, lessonVersion)` across attached buckets using a documented timestamp (earliest retained save). An account-wide unsave removes all matching bucket rows in one transaction; otherwise a second bucket could make a removed lesson reappear. Account attachment and save/unsave serialize on the same account lock. Future Community writes cannot reuse per-owner quotas as an account quota; that stage remains closed.

<a id="22-google-account-link--retention-logout-and-deletion"></a>
## Retention, logout, and deletion

Nicolas selected retention until account deletion on 2026-11-06. Attached private learning data remains while the account exists; the account deletion action removes it. A production launch still requires a published operational retention/deletion policy and scheduled maintenance. Unattached owners still expire in seven days. Purge selects only unbound expired roots and rechecks binding after the owner lock. Attachment winning the lock preserves the bucket; purge winning makes first attachment fail closed.

Logout revokes the current account session and clears its cookie; it does not delete data or silently switch back to an attached anonymous credential. The account-delete UI requires a recent verified account session and explicit confirmation. A new migration-owned token-bound deletion procedure verifies the actual library session token against its database session row and expiry, then locks the account and rechecks the session. It locks all bound owner roots in stable ID order. It calls the reviewed descendant-deletion helper for each bucket, deletes provider-account rows (including encrypted Google tokens), every account session, and finally the auth user, all in one PostgreSQL transaction. It receives no caller-supplied account ID or owner ID. Better Auth's database-backed OAuth verification row is keyed by random state, not user ID or email; the pinned library sets a ten-minute expiry and removes it on a completed callback. A pending or abandoned verification cannot safely be attributed to an account for deletion and must expire through dedicated verification maintenance; it never grants a RefView account session by itself. The local `owners:purge` maintenance command also removes bounded expired verification rows using database UTC time; operational scheduling remains separate. The new binding has `ownerId` unique with `ON DELETE CASCADE` from the owner root and an account FK with `ON DELETE RESTRICT`; root deletion removes each binding before the account row. The pinned auth-library schema, session token representation, exact foreign-key order, and grants must be reviewed before the procedure is enabled. The library's generic standalone delete-user endpoint remains disabled. A failure rolls back the whole deletion.

<a id="22-google-account-link--alternatives-rejected"></a>
## Alternatives rejected

- Reassigning attempts to one account owner violates immutable Assessment ownership and finalized claim contracts.
- Extending the existing seven-day owner cookie to account lifetime leaves the old bearer credential authoritative and cannot support independent multi-device revocation.
- Matching Google email to an anonymous owner or another account does not prove possession of that browser's anonymous cookie.

<a id="22-google-account-link--rollout-and-evidence-gates"></a>
## Rollout and evidence gates

1. Review this contract and the selected retention. Freeze the pinned OAuth library's exact session token/database representation and callback configuration. Keep account admission disabled without valid Google credentials.
2. Add auth-library tables and the owner binding/receipt migration under the dedicated migration login. Preserve existing Assessment tables. Review restricted grants and denial paths before applying to the application database.
3. Add provider-neutral attachment and account-owned service behavior, with PostgreSQL evidence for valid, wrong-owner, expiry-after-lock, retry, collision, rollback, attachment/purge, deletion versus finalize/save, concurrent first write without an anonymous cookie, and two-device membership behavior.
4. Wire Google callback, private account session, explicit ES/EN attachment and deletion UI, and account-aware Assessment/Academy routes. Inspect the full browser journey with registered local Google credentials.
5. Separately finish trusted publication of the approved Assessment items and positive scored browser acceptance. Do not label the visual preview as a real saved attempt.

<a id="22-google-account-link--source-guidance"></a>
## Source guidance

- [Next.js authentication guidance](https://nextjs.org/docs/app/guides/authentication): enforce authorization in Server Actions and the data access layer, rather than relying on route presentation.
- [Google web-server OAuth guidance](https://developers.google.com/identity/protocols/oauth2/web-server): use exact registered redirect URIs and verify callback state.
- [Better Auth Prisma adapter](https://better-auth.com/docs/adapters/prisma) and [Next.js integration](https://better-auth.com/docs/integrations/next): candidate maintained adapter for the pinned Prisma/Next.js stack.
- [Better Auth user/account behavior](https://better-auth.com/docs/concepts/users-accounts) and [account options](https://better-auth.com/docs/reference/options): implicit same-email linking and token encryption defaults require explicit safe configuration.
- [OWASP session management](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html): keep credentials in secure cookies, with independent revocation; do not store tokens in browser storage.
