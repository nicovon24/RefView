# Profile saved Academy lessons v1

## Scope

RV-052 first saves an exact reviewed Academy lesson version for the current private anonymous owner. Assessment saves and account sync are separate work. Device preferences remain in browser storage. Simulator history stays empty until a real owned scored attempt exists.

## Storage and authority

`SavedAcademyLesson` uses `(ownerId, lessonId, lessonVersion)` as its key and stores the canonical `contentHash` and database `savedAt`. Foreign keys bind the owner to `AnonymousSession` with delete cascade and the exact immutable lesson triple to `AcademyLessonVersion` with delete restriction. The app, reviewer, and PUBLIC roles receive no direct save-table privileges. Migration-owned `SECURITY DEFINER` functions are the only application access: `application_list_saved_academy(tokenHash, limit)`, `application_save_academy(tokenHash, lessonId, version, expectedHash)`, and `application_unsave_academy(tokenHash, lessonId, version)`. Each function resolves the real owner through `application_lock_owner` after acquiring its database lock; no caller-provided owner ID is accepted. Listing and deletion scope every row to that resolved owner. Function grants go only to the app role, with a pinned `pg_catalog` search path and bounded inputs.

Saving requires a preexisting valid owner cookie. The Server Action checks the exact configured Origin and strict input. Within one transaction, lock the owner, verify the published source through the Academy TypeScript reader, derive the hash server-side, and call the narrow save function. That function reacquires the same owner lock, then locks the exact Academy publication and independently checks its reviewed state, unrevoked bound review, source identity, canonical envelope/hash and evidence fields before `INSERT ... ON CONFLICT DO NOTHING`. Source versions are immutable, so the reader's semantic compilation remains valid while the function serializes publication state with retirement or withdrawal. A repeated save keeps its original timestamp. New saves of draft, retired, revoked, unavailable, or corrupt content fail closed at the server read; SQL also rejects structurally invalid published bindings when called directly. An unsave calls the narrow owner-scoped deletion function without publication eligibility; repeated unsave succeeds.

The application save function is migration-owned, has a fixed `pg_catalog` search path, uses an exact publication `FOR UPDATE` lock, and verifies reviewed state, unrevoked bound review, exact source hash/envelope, edition and source identity before inserting. It is distinct from the reviewer-only publication lock. Direct app-role table writes and other-owner reads/deletes are denied. SQL cannot re-run the TypeScript source compiler; the reviewed server service must perform that semantic verification inside the same transaction before the write function, and saved reads must fail closed if a later semantic check fails.

## Reads and deletion

Profile performs uncached, bounded owner-scoped reads through the narrow list function with stable ordering. It labels each saved exact version as available, retired, or unavailable; only an exact verified available version receives a link. Generic unavailable text replaces corrupt content. Missing owner, empty list, and read failure are different states. No owner ID, token, digest, or private Assessment material enters client props.

Existing self-delete and purge delete the owner root transactionally. Save rows cascade from that root; PostgreSQL tests must prove rollback, expiry and live-owner preservation. Saves disappear with the seven-day anonymous owner and do not sync across browsers. Deleting the server session leaves device preferences in browser storage; Profile's separate local reset removes them. This is the declared local scope, not a production deletion deadline.

## Acceptance evidence

TDD against PostgreSQL covers availability and hash binding, repeated/concurrent save and unsave, cross-owner isolation, malformed/expired cookies, save-versus-retire ordering, retired removable rows, restricted role privileges, and self-delete/purge. Browser acceptance requires lesson save, reload, Profile list, unsave, language and isolated browser profiles. Until a real lesson is published, infrastructure tests cannot close the full usable journey.

Read-only Astra/high architecture advice on 2026-11-04 recommended this Academy-only slice; runtime-confirmed model/effort was unconfirmed. Independent Sol/high review first returned FIX for direct app-table owner exposure and incomplete deletion wording. After the narrow function and device-preference corrections, focused independent re-review returned PASS. Reviewer runtime-confirmed model/effort was unconfirmed. This is a reviewed implementation contract, not persistence acceptance.
