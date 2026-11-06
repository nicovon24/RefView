# Device preferences v1

## Scope and precedence

- The early Profile stores non-sensitive display and control choices in this browser profile only. It does not create an account, server owner, or cross-device identity. The UI must say this clearly and offer a local reset.
- One versioned store key, `refview.preferences.v1`, owns all exposed values. No preference is accepted from an unvalidated old or malformed object. Unknown fields are discarded on read, and corrupt storage falls back to defaults without crashing. A schema change uses a new key/version and an explicit migration.
- The exact current route locale (`/es` or `/en`) controls the language of the current page. The locale-neutral `/` entry reads the validated device preference in a small client redirect and replaces its URL with `/${locale}`, using `/es` if storage is absent or invalid; its loading text is bilingual-neutral. This replaces the current unconditional `/es` redirect. A shared language-switch control saves the selected locale before navigating, while an explicit `/es` or `/en` URL always wins for that visit. The saved value never silently redirects an explicit locale URL.
- User-selected reduced motion overrides `prefers-reduced-motion`; with no saved choice, the OS setting is the effective default. Other settings use declared defaults. The UI distinguishes a stored choice from an OS-derived default.

## Exact payload and validation

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

## Use and limits

- Profile controls edit this one store. A reload of the same browser profile restores them. Controls previews and, later, the real simulator read the same validated record. An unset camera distance/lateral leaves each scene's authored framing intact: the controls preview uses 4 m / 0 m and the incident preview/playtest uses its protected 4.5 m / -1.5 m. An explicit compatible value overrides only the corresponding field. The current local playtest may remain unconnected until its integration task, but the UI must not claim a setting affects it until wired.
- The early Profile shows an honest empty history and does not invent scores, certificates, or saved content. Owned history and saved items require their separate reviewed server contracts; they are not represented by this device store.
- Reset removes the versioned key and recomputes OS/default values. A separate browser profile has separate preferences; clearing site data removes them. This is the declared retention/deletion behavior for this local slice.

## Required evidence

Test per-field invalid fallback, unknown fields, schema mismatch, storage errors, reload behavior, saved English at `/`, explicit `/es` precedence, language-switch writes, OS reduced-motion precedence, route-specific unset camera defaults, reset, and two independent browser profiles. Browser checks cover every exposed Profile control and actual consumers. The preference slice must be independently reviewed before marking RV-050 verified.
