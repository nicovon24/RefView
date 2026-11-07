<a id="06-assessments"></a>

<a id="06-assessments--assessment-owner-journey-v1"></a>
## Assessment owner journey v1

The application exposes only reviewed Assessment items whose immutable source, rubric, reviewer evidence, and publication binding recompile and verify on the server. The active attempt receives an allowlisted prompt and input specification; the private rubric and correction remain server-only until finalization. An unpublished or retired item cannot start a new attempt. A previously started attempt remains pinned and may be finalized or restored after retirement.

<a id="06-assessments--owner-and-transaction-contract"></a>
## Owner and transaction contract

The anonymous session cookie identifies an owner through a database lock function. The function locks the matching session, checks expiry against database time after lock acquisition, and returns only its internal ID and expiry. All Assessment writes and reads scope by that owner ID. A missing or expired owner has no accessible attempt. The shared owner resolver uses this function after the restricted role rollout; the application role never receives broad `AnonymousSession` UPDATE to acquire a lock.

Start validates a strict `{ itemId, version, locale }` input and runs one `READ COMMITTED` transaction: owner lock, `content_lock_assessment_eligibility`, exact published reader and pinned identity comparison, database timestamp, ready attempt insert. The publication lock remains until commit, serializing starts with retirement and withdrawal. Each successful start creates a new attempt; durable start idempotency needs an additional claim contract and is outside v1.

Finalize validates a strict `{ attemptId, idempotencyKey, answer, locale }` input and runs one transaction: owner lock, owner-qualified attempt lock, pinned source verification, normalized answer/evaluation/digest, claim/result check, then atomic submission/result/claim insertion and state transition. A same-key, same-digest retry returns the existing result; a changed digest conflicts. A new key with the same digest may alias the existing result. A changed digest under any key conflicts after finalization. Reasoning stays explicitly unscored. Database time is sampled after locks. No new-publication eligibility is required to finalize a pinned attempt.

Restore locks the owned attempt and reconstructs an active or finalized allowlisted projection. Finalized reads recompute the evaluation from the stored normalized answer and compare the digest, pinned identity, algorithm/correction version, and stored result before serialization. History is owner-scoped, bounded to 1–50 entries, sorted by `(startedAt DESC, attemptId DESC)`, with an owner-qualified cursor. Deleting the owner cascades Assessment descendants; explicit child deletion while the owner survives violates lifecycle guards.

The HTTP layer uses Server Actions for same-origin mutations after exact Origin and runtime checks; reads reauthorize the owner and stay private and uncached. Neither actions nor RSC payloads may serialize compiled source or private rubric. Public DTOs are the only output boundary. A text Assessment does not measure simulator positioning.

<a id="06-assessments--verification-gates"></a>
## Verification gates

Use real restricted `refview_app_test` PostgreSQL login for owner service tests. Cover valid and valid-wrong answers, same/different-key retries, normalized-equivalent answers, concurrent finalization, rollback after intermediate writes, wrong/expired/deleted owners, start versus retirement, pinned continuation after retirement, restore/history versus owner deletion, role denial, source/result mismatch, and private DTO secrecy. Browser checks use Playwright CLI once routes exist. Synthetic reviewed content in `refview_test` supplies the positive fixture; editorial candidates stay draft pending exact Nicolas review.

---

<a id="19-content-publication"></a>

<a id="19-content-publication--publication-design"></a>
## Publication design

Use separate concrete Academy and Assessment tables with immutable source version triples, bound review rows, revisioned publication state, and append-only events. Share principal resolution, exact source recompilation, eligibility, and transaction conventions. Avoid a polymorphic content table that weakens foreign keys.

The local administrator credential stays outside the web process. Normal application credentials may read reviewed public projections and create learner attempts through owner-validated actions, but cannot directly insert trusted reviews or promote publication. A reviewed CLI maps the authenticated PostgreSQL role to the actual actor and binds Nicolas's direct review to immutable evidence.
V1 uses direct review by Nicolas through a provisioned credential. A separate migration role owns the protected schema; the application and reviewer roles are non-owners. Historical statement import is deferred. Independent Sol/high read-only contract review returned PASS after the role, affirmative-decision and revocation-race corrections; requested reviewer identity was `gpt-6-sol`/high and runtime-confirmed identity unconfirmed. No schema or CLI is implemented by this contract review.

Draft imports, schema constraints, synthetic PostgreSQL authority tests, and empty/unavailable UI states can be built before Nicolas's exact-hash approval. The current source hashes may change during editing; publication requires review of the final bytes. Browser projections must be checked for private Assessment material in HTML, RSC payloads, metadata, prefetch, and client bundles.

Read-only Astra/high migration advice found that the local bootstrap `refview` credential is a superuser and owns the existing tables. A restricted application role, a distinct migration owner, and a Nicolas-bound reviewer role must be provisioned and tested through actual separate PostgreSQL logins before the publication implementation can claim authority. Provision the isolated test database first, preserve application rows, and transfer only allowlisted objects. The advice also identified that PostgreSQL cannot run the TypeScript/Zod source compiler and that application row locks must not require publication UPDATE privilege. The shared contract now specifies CLI recompilation inside the lock transaction, independent SQL byte/identity checks, fail-closed application reads, and narrow definer lock procedures. The first independent Sol/high read-only re-review returned FIX for undefined draft-import authority and a missing envelope-to-JSON equality check; the coordinator specified both and focused re-review returned PASS. The reviewer also clarified that the rubric envelope binds through the parent source triple. Requested advisor identity `gpt-6-astra`/high and reviewer `gpt-6-sol`/high; runtime-confirmed unconfirmed. The contract is reviewed; schema, roles, and CLI are still to implement.

The coordinator added Prisma models for separate Academy and Assessment version/review/revocation/publication/event rows and a reviewer principal map. `pnpm --filter @refview/web db:validate` and `db:generate` passed at the schema-draft stage. A delegated test-only role provisioning script passed static PowerShell parsing. Its first independent Sol/high review found missing schema ownership transfer and incomplete index/composite inventory guards; the implementer corrected both and focused read-only re-review returned PASS. Requested implementer `gpt-6-sol`/medium, reviewer `gpt-6-sol`/high; runtime-confirmed identities unconfirmed.

The coordinator created an ignored Windows user-encrypted credential file for the isolated test roles, ran the reviewed provisioning script twice against `refview_test`, and each run reported success. A separate-login probe connected as migration, application, and synthetic reviewer roles; all three reported non-superuser, no role membership or database CREATE, only migration schema ownership/CREATE, and no application/reviewer table mutation privilege. Independent Sol/high post-execution read-only review returned PASS: the test database retained 15 tables, 7 functions, 33 indexes, 16 triggers and its data; migration owns its schema and allowlisted objects; application/reviewer test logins have zero readable or mutable tables in either database. The local application database still reported `public` owned by `pg_database_owner` and zero new Academy/Assessment tables. The reviewer noted that PostgreSQL's default PUBLIC CONNECT still permits a test role to connect to the app database, though it has no data/DDL rights; application database hardening must revoke default CONNECT and grant only explicit app/migration roles before claiming full database isolation. No application database rows, real reviewer identity, or publication state were changed. Requested reviewer `gpt-6-sol`/high, runtime-confirmed unconfirmed.

Independent Sol/high schema review found that publication events did not bind their content hash or optional review to the exact published triple. The coordinator added composite event-to-publication and optional event-to-review foreign keys for both content kinds in the Prisma schema and migration. `db:validate` passed and scoped read-only re-review returned PASS. Requested reviewer `gpt-6-sol`/high; runtime-confirmed unconfirmed. Prisma configuration now leaves `datasource.url` unset without `MIGRATION_DATABASE_URL`: `db:validate` succeeds without it and `prisma migrate status` exits 1 instead of falling back to the app `DATABASE_URL`. The README no longer instructs deployment of content migrations without a dedicated credential.

The first content migration now includes atomic role preflight, tagged UTF-8 source/rubric envelope checks, immutable rows, legal draft/reviewed/retired transitions, audited events, and narrow migration-owned definer functions. A Sol/high independent SQL guard review passed after integration and role-preflight corrections; another Sol/high review passed the test role-grant script after its explicit revocation and effective-privilege check. Requested implementer `gpt-6-sol`/medium and reviewers `gpt-6-sol`/high; runtime-confirmed identities unconfirmed. The restricted migration login applied this migration only to `refview_test`. The reviewed test grants ran twice, and all three restricted logins passed separate connection probes. A synthetic test-only Nicolas principal mapping enabled the reviewed draft CLI to import and verify the one Academy and three Assessment exact candidates; all four remain draft with zero reviews, revocations, or publication events. The coordinator's separate-login authority probe found direct app/reviewer review and publication DML denied, app import/principal procedures denied, and reviewer eligibility lock denied. A Sol/high independent read-only postcheck confirmed the app database still has no content tables, functions, or content migration record and the test database has migration-owned protected objects and no direct app/reviewer mutation privilege. This is an isolated test rollout, not real Nicolas admission or publication. Race and source-semantic published-read tests remain open.

The synthetic publication fixture review caught the legacy test principal's false `nicolas` attribution before any positive review was admitted. A dedicated migration replaces that test mapping with `synthetic-assessment-reviewer-test`; the real database branch still requires a separately provisioned `nicolas` mapping. Its first Prisma application failed on SQL syntax and rolled back. The coordinator fixed the preflight, passed a restricted-login full-migration `BEGIN`/`ROLLBACK` dry run, marked the failed Prisma record rolled back, and applied the reviewed correction only to `refview_test`. The test reviewer then admitted and published one distinctly named synthetic Assessment item for persistence tests. The one Academy and three Assessment editorial candidates remain draft. Separate app/reviewer login denial checks passed again. Independent Sol/high read-only database postcheck passed: synthetic principal/review/event/hash bindings match, the actual candidates have no review/event, protected objects remain migration-owned, restricted roles have no direct content DML, and the app database has no content or Assessment attempt migration. This does not represent Nicolas's approval or publication of any candidate. Requested reviewer `gpt-6-sol`/high; runtime-confirmed unconfirmed.

---

<a id="21-learning-ui-first"></a>

<a id="21-learning-ui-first--learning-interface-first-design"></a>
## Learning interface-first design

Use the existing RefView field-led visual language and feature-local presentation components. Server route containers supply already authorized data and action slots; visual components do not select database rows or decide publication.

<a id="21-learning-ui-first--view-boundaries"></a>
## View boundaries

| View | Presentation input | Authority outside the view |
| --- | --- | --- |
| Academy catalog | Locale, `CatalogLesson[]`, read outcome, explicit published/preview mode | `readAcademyCatalog` and verified publication |
| Academy lesson | Locale, `PublicLesson`, save-control slot, navigation targets, explicit mode | `readAcademyLesson`, exact-version save, practice eligibility |
| Assessment catalog | Locale, catalog DTOs, counts, selected level, start-control slot, explicit mode | `readAssessmentCatalog`, owner resolution, start action |
| Assessment question | Active-attempt DTO and action/form slot only | No accepted answer, rubric, correction, or result in question props |
| Assessment result | Finalized-result DTO and next-action slot | Server evaluation, ownership, and finalized provenance |

Academy interface preview may project the approved fixture server-side through `projectPublicLesson` with no practice or save action. Public Academy routes retain their DB readers. Assessment interface preview reuses the existing `/[locale]/assessments/editorial-preview` local draft-only gate and has separate question and correction requests. It must never weaken that gate or include answer/correction markup on the question screen. A preset example correction is labelled as an illustration, not as evaluation of the visitor's choice. Public Assessment routes retain their DB readers and owner actions.

The exact approved source fixtures are not edited in this pass. The visual preview is not a publication transition or an alternate database.
