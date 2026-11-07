# RefView

RefView is a Spanish-first, bilingual football refereeing platform. The local Academy offers 2026/27 Rules of the Game guides, topic navigation, and one reviewed lesson. Community has a locally shared account-owned match/post and reaction path; early Profile continues in parallel. Standalone Assessment pages, Profile attempt history, and Academy practice links are currently removed from the app. Evaluation and practice will return as part of the 3D simulation experience.

## Status

Academy has a navigable 2026/27 directory of all 17 IFAB Laws at `/es/academy` and `/en/academy`. Each Law page has original bilingual explanation, key points, an original technical diagram, an illustrative generated photo, previous/next Law links, and an edition-pinned PDF page reference. Thirty bilingual topic guides cover all 17 Laws with substantive source-linked sections, diagrams, contextual photos, and adjacent navigation. One approved lesson and three reviewed exercises remain published in the local database for future use. See [the Law guides](docs/features/01-academy/review.md#04-academy--law-guides), [the latest topic expansion](docs/features/01-academy/review.md#04-academy--foundation-and-match-official-topics), and [the publication review](docs/features/06-simulator-experience/assessment-integration/review.md#19-content-publication).

The public Academy serves reviewed local lessons. Assessment routes and the Assessment interface preview are currently unavailable in the app, along with Profile attempt history and Academy practice links; their reviewed source material and local database records remain for later integration into the simulator. Earlier browser acceptance evidence describes the state before the routes were disabled. See [the interface review](docs/features/06-simulator-experience/assessment-integration/review.md#21-learning-ui-first) and [the publication review](docs/features/06-simulator-experience/assessment-integration/review.md#19-content-publication).

Community at `/es/community` and `/en/community` now shows real account-owned play opinions to local visitors, with account-bound agreement/disagreement and reporting. The workspace at `/es/community/my` and `/en/community/my` publishes new complete matches and posts on visible matches immediately; earlier pending records remain private. Owners can remove their posts or matches, and a separate local moderator credential can hide/remove reported content. The former fictional feed cards and detail routes were removed at Nicolas's request. Restricted PostgreSQL and two-account bilingual browser acceptance passed before that presentation change in isolated databases; see [the social review](docs/features/03-community/review.md#20-community-social). Comments, referee ratings, uploads, and deployment remain outside this slice.

The repository contains product, architecture, and SDD planning, a runnable static design prototype, deterministic timeline/observation/evaluation modules, and RV-006 PostgreSQL persistence under development. A neutral referee-controls preview and a separate authored WebGL incident preview exist. The incident preview shows seven footballers, ball, challenge and fall, but has no live referee capture, saved decision, scored attempt, or AI request. The complete playable incident is not yet implemented.

The current product direction is specified in [the delivery sequence](docs/features/00-product-foundation/requirements.md#17-app-first-delivery). Community and Profile are still partial journeys, and the static prototype remains illustrative. Community combines real local submissions with a distinct fictional demonstration. Academy and the local database retain reviewed lesson and exercise content. A previous browser run confirmed a scored exercise, prepared correction, saved lesson, and Profile history; the standalone exercise UI is now disabled pending integration into 3D simulation. Full Community journey acceptance, account-linked learning data, and production deployment remain separate work. The simulator incident playtest remains unsaved and unscored.

## Visual and motion refinement

The home page links directly to the authored incident, neutral controls and clearly labeled local playtest. The authoring preview and local playtest now share the Quaternius rigged players Nicolas selected in the player audition, including generic numbered kits, hair and boots. Verified local resources and one absolute-tick pose adapter drive the seven players; authoring retains the previous procedural model as a comparison. Contact/fall constraints are a new visual candidate, not approved observation geometry. Spanish and English remain supported.

The RV-019B interface pass adds consistent navigation across the implemented site and a field-led authoring review. RV-019C makes the local playtest viewport-filling from entry: one deliberate action requests mouse capture and fullscreen, active play hides buttons and counters, and pause/completion controls live inside the field. RV-019D deepens the shared stadium into a populated two-tier bowl, adds fixed natural-green grass variation, refines the numbered players and referee, and improves the protected motion clips. The authoring route remains a review surface; the local run remains unsaved and unscored. See [interface verification](docs/features/06-simulator-experience/review.md#12-site-interface-refinement), [immersive incident verification](docs/features/06-simulator-experience/review.md#13-immersive-playtest), and [stadium/motion verification](docs/features/06-simulator-experience/review.md#14-stadium-character-motion).

Open `/es/simulator/incident-preview` for deterministic authoring controls or `/es/simulator/incident-playtest` for the unsaved/unscored local run. These are not a published training attempt. The selected rigged resources, motion and renderer code require renewed training evidence. See [selected-player verification](docs/features/06-simulator-experience/review.md#15-rigged-football-presentation) and [rigged presentation requirements](docs/features/06-simulator-experience/requirements.md#15-rigged-football-presentation).

## Run the application foundation

Use Node.js 24 and pnpm 10.33.2. Docker is needed for the PostgreSQL smoke test. In PowerShell from the repository root:

```powershell
pnpm install --frozen-lockfile
docker compose up -d postgres
pnpm db:generate
pnpm db:validate
pnpm test
pnpm test:db
pnpm lint
pnpm typecheck
pnpm build
pnpm dev
```

These commands assume the existing local databases and `apps/web/.env` are configured. For a fresh environment, `.env.example` identifies the required variables but its app password is a placeholder; provision distinct migration, app, reviewer, and Community moderator logins before using it. The local `refview` and `refview_test` databases have 24 applied migrations, including account ownership, reviewed learning content, and the locally shared Community path. The web runtime uses `refview_app`, while migration, reviewer, and moderator secrets stay outside Next's environment file. `DATABASE_URL` targets the application database, `TEST_DATABASE_URL` targets only the isolated `_test` database, and `REFVIEW_APP_ORIGIN` names the exact browser origin. Migration commands require a separate `MIGRATION_DATABASE_URL`; they never fall back to the app credential. `docker compose down` stops this project's service and retains its named volume.

Open `http://127.0.0.1:3000` (redirects to Spanish `/es`) or `/en`. To try real WASD movement, sprint, pointer lock, pause, and adjustable third-/first-person cameras on a neutral field, open `http://127.0.0.1:3000/es/simulator/controls` (or `/en/simulator/controls`) on a desktop with keyboard and mouse. This technical preview has no authored incident, observation score, decision, replay, or saved attempt. The full static concept is also available at `/prototype/index.html`.

The authored review scene is at `http://127.0.0.1:3000/es/simulator/incident-preview` (or `/en/`). It has A/B first- and third-person views and an elevated pass review. The elevated view is for authoring only and earns no observation credit. Nicolas called the scene â€œesta bastante bienâ€ after the scoped visual question and requested later improvements to full-screen layout and characters. This is not final product acceptance or a published training attempt.

For the isolated anonymous-session transport check, start a separate development server from `apps/web` with `REFVIEW_SESSION_TEST_MODE=1` and `REFVIEW_ORIGIN` set to that server's exact loopback origin. For example, on port 3017:

```powershell
$env:REFVIEW_SESSION_TEST_MODE = "1"
$env:REFVIEW_ORIGIN = "http://127.0.0.1:3017"
pnpm exec next dev --hostname 127.0.0.1 --port 3017
```

Open `/es/simulator/session-preview` on that port. This technical route uses only `TEST_DATABASE_URL`, refuses production/non-isolated targets, and creates anonymous sessions only. It does not publish a scenario or create an attempt. The separate `.next-session-test` build directory keeps the normal preview server available.

For a browser smoke check with Playwright CLI, leave `pnpm dev` running in one terminal and use a second terminal:

```powershell
playwright-cli open http://127.0.0.1:3000 --browser=chrome
playwright-cli snapshot
playwright-cli click "getByRole('link', { name: 'EN' })"
playwright-cli resize 390 844
playwright-cli screenshot
playwright-cli close
```

Confirm that `/` follows the validated device language preference (Spanish when unset), English text and `lang="en"` on English routes, a visible 3D field and ready message, and no horizontal mobile overflow. The actual browser check on 2026-11-03 used Headless Chrome 156 on Windows with an AMD Radeon RX 6700 XT, 16 GB RAM, at 1280Ã—720 and 390Ã—844. WebGL2 was available; no simulator frame-time or FPS claim is made from this neutral static field.

The app currently uses a local PostgreSQL service on `127.0.0.1:55439`. Both checked-in RV-006 migrations were applied to the local application database on 2026-11-04, but there is no complete saved-attempt flow. Generated Prisma code is ignored and must be regenerated after installation. The controls preview's loading, ready, pause, focus-loss, and simulated unsupported-WebGL states were checked in Chrome; the rendering-error boundary remains unexercised. Referee geometry is a placeholder and static obstacle collision is not implemented. The authored WebGL preview received a scoped independent visual PASS, but it has no scored observation.

Profile now offers an explicit private anonymous session backed by the application database. It expires after seven days, stays in the current browser, and can be deleted from Profile. To remove expired local sessions in bounded batches, run `pnpm --filter @refview/web owners:purge --limit 100` from the repository root. The command validates the application runtime and reports only an aggregate deletion count; it is not scheduled in production and does not establish a deletion deadline.

To review the interactive design locally:

```powershell
python -m http.server 4173 --directory docs\prototype
```

Open `http://127.0.0.1:4173`. The prototype uses generated still images; its camera and replay controls demonstrate interface behavior, not live 3D evidence.

See:

- [Product definition](PRODUCT.md)
- [Canonical task tracker](docs/specs/tasks.md)
- [Orchestration workflow](docs/architecture/orchestration.md)
- [Technology stack decision](docs/architecture/technology-stack.md)
- [Shared domain contracts](docs/contracts/README.md)
- [First playable incident requirements](docs/features/05-simulator-incident/requirements.md#01-playable-incident)
- [Source-backed first incident brief](docs/features/05-simulator-incident/incident-brief.md)
- [Full product journeys](docs/prototype/product/journeys.md)
- [Delivery roadmap](docs/prototype/product/delivery-roadmap.md)
- [Complete feature and ticket index](docs/features/README.md)
- [Project continuity](CHECKLOG.md)
- [Interactive product design](docs/prototype/README.md)
- [Design system](DESIGN.md)

## Technical direction

- Next.js App Router and strict TypeScript.
- Prisma ORM 7 and PostgreSQL.
- Radix Primitives, Tailwind CSS, and CVA.
- Three.js, React Three Fiber, Drei, and Rapier.
- XState, Zod, Vitest, and Playwright CLI.
- Deterministic authored scenarios and evaluation that work without an AI provider.

After the app-first journeys, the simulator implementation gate is exact rendered-evidence binding and trusted publication of the authored source, then incident live capture and scored-scene integration. Isolated PostgreSQL draft/start/finalize/restore and a separate cookie-only browser session proof pass tests; neither provides a user-facing saved attempt. Nicolas approved the football brief and gave scoped positive feedback on the rendered authoring scene on 2026-11-03. RV-005, RV-006, and RV-007 remain in progress; RV-008 is in review. Pure geometry or a renderer receipt does not prove that evidence was perceived or understood.
