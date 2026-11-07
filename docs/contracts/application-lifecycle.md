# Application lifecycle and preferences

This document groups reusable system contracts by domain. Stable contract IDs are preserved in section anchors; implementation and task status remain in [`../specs/tasks.md`](../specs/tasks.md). Feature-specific acceptance remains under `docs/features/`.

## Contents

- [application anonymous owner v1](application-lifecycle.md#application-anonymous-owner-v1)
- [device preferences v1](application-lifecycle.md#device-preferences-v1)

<a id="application-anonymous-owner-v1"></a>
## Application anonymous owner boundary v1

### Scope and configuration

- This is a shared same-origin owner foundation for local application data and a future HTTPS deployment. It creates no account, public identity, published incident, assessment, or Community interaction by itself. The isolated `REFVIEW_SESSION_TEST_MODE` route and `openTestDatabase()` remain test-only and must not be used as application admission.
- A server-only application runtime requires `DATABASE_URL` and `REFVIEW_APP_ORIGIN`. It accepts only PostgreSQL URLs; rejects a database name ending `_test`, the same database target as `TEST_DATABASE_URL` after comparing normalized host, port, and decoded database name (regardless of credentials/query spelling), missing/malformed config, and active isolated session-test mode. It never falls back to a test URL. In `NODE_ENV=production`, origin must be exact HTTPS. In development, HTTP is allowed only on `127.0.0.1`, `localhost`, or `[::1]` with an explicit port. The configured origin is one serialized origin with no credentials, path beyond `/`, query, fragment, wildcard, trailing slash, or comma-separated values. It is never inferred from Host or forwarding headers.
- Every application Server Action independently validates runtime, exact `Origin === REFVIEW_APP_ORIGIN`, strict bounded input, and the current owner before mutation. Next.js built-in same-origin checks remain in place; no broad allowed-origins list is added. Mutating HTTP endpoints, if introduced, use equivalent checks; private GET reads authorize without assuming an `Origin` header. A failure makes no database change or cookie write.

### Cookie and owner lifecycle

- The owner token has 256 random bits. PostgreSQL derives `createdAt` from its wall clock and `expiresAt = createdAt + interval '7 days'`; it stores only `sha256:` plus the token digest and those timestamps. The application cookie is `refview_session` with `Secure`, `HttpOnly`, `SameSite=Lax`, `Path=/`, no Domain, and `Max-Age` computed from the returned database expiry at cookie-write time, capped at seven days and never extended on reuse. Local loopback Chrome transmission must be verified; if a target browser cannot transmit a Secure cookie over loopback HTTP, local development must use HTTPS or a separately reviewed, explicitly scoped cookie exception. Do not silently weaken the cookie.
- A read-only server function returns `missing` or `{ status: "active", expiresAt }`, without creating/renewing a session or setting/clearing a cookie. Malformed, unknown, oversized, missing, and expired tokens all read as missing. Database/configuration failure is an unavailable error, never treated as a missing owner and never triggers replacement bootstrap.
- Explicit bootstrap is a same-origin Server Action accepting exact `{}`. If the cookie resolves to a valid owner, it returns the same expiry without a write or renewal. Otherwise it creates a new empty owner in PostgreSQL, then sets the cookie only after successful commit, and returns only `{ status: "active", expiresAt }`. No token/hash/internal owner ID is returned or rendered. Two independent concurrent first bootstraps with no cookie cannot be deduplicated by this protocol; they can create separate empty sessions. The client shares one pending bootstrap promise before its first feature mutation. Duplicate empty sessions expire and are purged.
- Ordinary feature mutations never silently create an owner. They require a previously bootstrapped valid cookie and reject missing ownership. IDs and idempotency keys are never authorization. Owner-bound reads are private and uncached.

### Transaction guard, expiry, and idempotency

- All owner-bound application mutations and reads use one reviewed owner resolver. The database clock determines expiry. Inside a transaction, lock the owner row before any feature row: shared lock for normal work, exclusive lock for self-delete/purge. Check expiry **after** lock acquisition using PostgreSQL wall time, not a transaction-start timestamp that may be stale while waiting. An operation admitted before expiry may finish its bounded transaction; one first admitted at or after expiry fails. This guard must eventually replace inconsistent owner checks in authored start/run/restore/finalization before real simulator acceptance.
- Feature actions validate exact input and derive their own server-side digest before returning a prior idempotent result. Every retry revalidates the owner. Feature-specific PostgreSQL uniqueness enforces one save per content identity, one rating per match/owner, one reaction per comment/owner, and one initial assessment/simulator result per attempt; the shared owner boundary does not invent those semantics.
- Responses, Server Component props, metadata, client storage, URLs, and logs contain no owner token/hash/ID, private answer key, or another owner's record.

### Deletion and retention

- A strict same-origin `{}` self-delete action locks the current owner and deletes all owned data transactionally, then clears the cookie with matching name/path/security scope. A missing/deleted owner yields the same empty success. A database failure rolls back and leaves the cookie intact. Canonical content/publication/review records remain. Future saves, assessments, and Community tables must be added to the reviewed deletion plan before they store owner data.
- For the current schema, verify the PostgreSQL deletion order: finalization claims, evaluations, observation traces, decisions, run starts, attempts, plan items, plans, then anonymous session. Do not assume cascading through `RESTRICT` foreign keys. Deletion and purge serialize with ordinary owner operations on the owner row.
- Expired data is inaccessible immediately. A server-only bounded purge command removes expired owners and descendants with row locking, skips live owners, is repeatable, and reports only aggregate counts. A local command does not prove a production deletion deadline. A future deployment must add a scheduled run, failure monitoring, and a reviewed retention promise before claiming production privacy readiness. Lost cookies mean no self-service recovery; expiry and purge still apply.

### Required evidence

PostgreSQL tests cover runtime rejection, origin rejection, strict bootstrap shape, no cookie on failed insert, read-only no-create behavior, active no-renewal, malformed/unknown/expired tokens, lock-wait expiry, wrong-owner reads/mutations/deletion, concurrent operations, idempotent self-delete, full child deletion order, purge rollback/repeat/live-owner preservation, and no token/ID leakage. Browser checks cover actual cookie transmission, reload, separate browser profiles, deletion, expiry, and bilingual empty/error states. Shared configuration, authentication, authorization, privacy, and persistence all require independent read-only review before marking application owner admission verified.

<a id="device-preferences-v1"></a>
## Device preferences v1

### Scope and precedence

- The early Profile stores non-sensitive display and control choices in this browser profile only. It does not create an account, server owner, or cross-device identity. The UI must say this clearly and offer a local reset.
- One versioned store key, `refview.preferences.v1`, owns all exposed values. No preference is accepted from an unvalidated old or malformed object. Unknown fields are discarded on read, and corrupt storage falls back to defaults without crashing. A schema change uses a new key/version and an explicit migration.
- The exact current route locale (`/es` or `/en`) controls the language of the current page. The locale-neutral `/` entry reads the validated device preference in a small client redirect and replaces its URL with `/${locale}`, using `/es` if storage is absent or invalid; its loading text is bilingual-neutral. This replaces the current unconditional `/es` redirect. A shared language-switch control saves the selected locale before navigating, while an explicit `/es` or `/en` URL always wins for that visit. The saved value never silently redirects an explicit locale URL.
- User-selected reduced motion overrides `prefers-reduced-motion`; with no saved choice, the OS setting is the effective default. Other settings use declared defaults. The UI distinguishes a stored choice from an OS-derived default.

### Exact payload and validation

The stored JSON object is `{ schemaVersion: 1, locale, cameraMode, cameraDistanceM, cameraLateralM, mouseSensitivity, invertY, reducedMotion, quality }`. Its fields are exact:

| Field | Values / default |
| --- | --- |
| `locale` | `es` or `en`; default `es` |
| `cameraMode` | `thirdPerson` or `firstPerson`; default `thirdPerson` |
| `cameraDistanceM` | `null` (use each scene's authored default), or finite number from `2` through `8` in `0.5` steps; default `null` |
| `cameraLateralM` | `null` (use each scene's authored default), or finite number from `-3` through `3` in `0.5` steps; default `null` |
| `mouseSensitivity` | finite number from `0.2` through `2` in `0.1` steps; default `1` |
| `invertY` | boolean; default `false` |
| `reducedMotion` | `true`, `false`, or `null`; default `null` means follow the OS |
| `quality` | `low` or `high`; default `high` |

Only finite supported values may be written. On read, each invalid individual field falls back independently so one bad value does not discard valid choices. The application writes the full validated record atomically to local storage. If storage is unavailable or quota fails, the UI keeps the current in-memory choice and clearly states that it will not survive reload. No sensitive content, session token, attempt result, saved item, or owner ID goes into this store.

### Use and limits

- Profile controls edit this one store. A reload of the same browser profile restores them. Controls previews and, later, the real simulator read the same validated record. An unset camera distance/lateral leaves each scene's authored framing intact: the controls preview uses 4 m / 0 m and the incident preview/playtest uses its protected 4.5 m / -1.5 m. An explicit compatible value overrides only the corresponding field. The current local playtest may remain unconnected until its integration task, but the UI must not claim a setting affects it until wired.
- The early Profile shows an honest empty history and does not invent scores, certificates, or saved content. Owned history and saved items require their separate reviewed server contracts; they are not represented by this device store.
- Reset removes the versioned key and recomputes OS/default values. A separate browser profile has separate preferences; clearing site data removes them. This is the declared retention/deletion behavior for this local slice.

### Required evidence

Test per-field invalid fallback, unknown fields, schema mismatch, storage errors, reload behavior, saved English at `/`, explicit `/es` precedence, language-switch writes, OS reduced-motion precedence, route-specific unset camera defaults, reset, and two independent browser profiles. Browser checks cover every exposed Profile control and actual consumers. The preference slice must be independently reviewed before marking RV-050 verified.
