# Profile preference review evidence

Task status is tracked only in [`../../specs/tasks.md`](../../specs/tasks.md).

## RV-050 device preference slice

The coordinator's [`../../contracts/device-preferences-v1.md`](../../contracts/device-preferences-v1.md) passed independent Sol/high read-only review after resolving locale entry and scene-camera default conflicts. Runtime-confirmed model/effort was unconfirmed.

A bounded Sol/medium implementation added a bilingual Profile page and validated browser-profile store. Red TDD evidence: the initial focused Vitest command failed before the store existed. Green evidence: after correction rounds, six store/validation tests passed. Independent Sol/high code review found locale overwrite, storage-failure memory, status-copy, per-field test, and OS-motion listener issues; final read-only re-review returned PASS. Runtime-confirmed identity was unconfirmed for both agents.

After the final code edits, the coordinator observed:

- `pnpm --filter @refview/web test`: 38 files passed, 3 skipped; 203 tests passed, 6 skipped.
- `pnpm --filter @refview/web typecheck`: passed.
- `pnpm --filter @refview/web lint`: passed.
- `pnpm --filter @refview/web build`: passed; both Profile locale routes generated.
- Playwright CLI `/es/profile`: every exposed control visible and labeled, changed camera mode/distance, invert Y, reduced motion, and quality, then reloaded; selected values remained. An explicit `/es/profile` stayed Spanish while the stored preferred locale was English.
- Playwright CLI `/es/simulator/controls`: opening settings showed saved first-person mode, 5 m distance, inverted Y, reduced motion, and low quality. The controls preview reads preferences at open; local changes there remain preview-only. Scene-default camera values remain unchanged when the stored override is null.
- Playwright CLI Profile reset removed `refview.preferences.v1` and showed a reset status.
- Playwright CLI shared header English switch saved `locale=en`; visiting `/` then reached `/en`. A second named browser session with no saved key reached `/es` and could not read the first session's preference key. An explicit `/es/profile` still rendered Spanish.
- Playwright CLI mobile 390x844 Profile and desktop 1280x720 Home/Profile visual captures were inspected; no visible overflow or inaccessible control was found. The existing Three.js `Clock` deprecation warning appeared on Home/controls, with no page errors; this is unrelated to preferences.

Visual captures include [`../../../artifacts/profile-mobile-top.png`](../../../artifacts/profile-mobile-top.png), [`../../../artifacts/profile-mobile.png`](../../../artifacts/profile-mobile.png), and [`../../../artifacts/home-header-profile.png`](../../../artifacts/home-header-profile.png).

The device store is intentionally local. The incident playtest does not yet consume the values; Profile says so. It does not hold owned saved items or attempts, and cannot stand in for the later PostgreSQL history/privacy work.

## RV-052 saved Academy persistence slice

The exact-version, token-bound save design in [`design.md`](design.md) passed independent Sol/high read-only review after replacing direct app-table access with narrow migration-owned functions. A bounded Sol/medium worker added the Prisma model and PostgreSQL migration. Independent Sol/high static review returned PASS after a timestamp precision and referential-action correction. The coordinator applied migration `20261105070000_saved_academy_lesson_v1` under restricted migration logins to `refview_test` and `refview`; both now have twelve completed migrations.

The first restricted-login PostgreSQL suite passed 8/8 for app/reviewer grants, owner isolation, exact publication eligibility, idempotent save/unsave, duplicate/concurrent save, expiry, and owner deletion/purge. Independent Sol/high review returned FIX because it did not prove concurrent save against actual reviewer retirement/withdrawal. The bounded test worker added four genuine two-login races using disposable synthetic reviewed lessons, actual reviewer procedures, and observed publication-row blocking. It reported 12/12 passing, web typecheck, and scoped ESLint. Independent Sol/high read-only re-review returned PASS for the race test design and cleanup; it did not independently rerun the DB suite. Requested worker/reviewer models and efforts were Sol/medium and Sol/high; runtime-confirmed identities were unconfirmed.

At that persistence checkpoint, the service, visible save/list/unsave UI, real published lesson, and browser acceptance remained open. No simulator history was claimed.

The bounded Sol/medium service later passed 5/5 restricted PostgreSQL tests. Independent Sol/high review initially returned FIX for projecting after the owner lock, weak retired-binding checks, database errors masked as per-row unavailability, and a test URL that did not pin the restricted role. The worker kept projections under the owner transaction, verified retirement events and reviewed source binding, separated semantic corruption from database outages, and pinned the restricted test login. Independent read-only re-review returned PASS; web typecheck passed. Runtime-confirmed identities were unconfirmed.

A bounded Sol/medium UI worker connected Profile's owner-scoped list and unsave action with missing/empty/unavailable, available/retired/unavailable-version states, bilingual text and exact-Origin action validation. Initial independent Sol/high review returned FIX for a stale client owner panel after server refresh; the worker remounted its local state on changed server status/expiry. Focused re-review returned PASS. Fourteen action tests, web typecheck/scoped lint, and Playwright ES/EN empty/bootstrap/delete/mobile flows passed. The available-lesson Save control and positive browser save/unsave remain dependent on a real locally published Academy lesson. Runtime-confirmed identities were unconfirmed. The simulator history remains empty by design in this stage.
