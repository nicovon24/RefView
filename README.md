# RefView

RefView is a Spanish-first, bilingual football refereeing platform. The current work focuses on the Academy's 2026/27 Rules of the Game guides and topic navigation. Nicolas has deferred the lesson editorial/publication path while this rules experience is built. Assessments, the fictional Community visual journey, and early Profile follow; the local 3D playtest and saved/scored authored incident come last.

## Status

Academy has a navigable 2026/27 directory of all 17 IFAB Laws at `/es/academy` and `/en/academy`. Each Law page has original bilingual explanation, key points, an original technical diagram, an illustrative generated photo, previous/next Law links, and an edition-pinned PDF page reference. Thirty bilingual topic guides now cover all 17 Laws; each has substantive source-linked sections, a technical diagram, a contextual photo, and adjacent navigation. The approved lesson and three Assessment drafts remain unpublished and absent from public catalogs. See [the Law guides](docs/features/04-academy/law-guides-review.md) and [the latest topic expansion](docs/features/04-academy/final-laws-topics-review.md).

The current Academy and Assessment UI pass has separate, unpublished local previews: `/es/academy/interface-preview` shows the exact approved bilingual lesson, while `/es/assessments/editorial-preview?interface=catalog` shows the three approved draft exercises with separate question and example-correction views. Their reusable views also serve the publication-gated routes. This is interface review only: public catalogs remain empty until trusted publication, and the preview does not save or score. See [the interface review](docs/features/21-learning-ui-first/review.md).

The repository contains product, architecture, and SDD planning, a runnable static design prototype, deterministic timeline/observation/evaluation modules, and RV-006 PostgreSQL persistence under development. A neutral referee-controls preview and a separate authored WebGL incident preview exist. The incident preview shows seven footballers, ball, challenge and fall, but has no live referee capture, saved decision, scored attempt, or AI request. The complete playable incident is not yet implemented.

The app-first order is specified in [the delivery sequence](docs/features/17-app-first-delivery/requirements.md). Academy, Assessments, Community, and Profile are not yet complete production journeys; the static prototype remains illustrative. Community at `/es/community` and `/en/community` now visually demonstrates a post-first fictional discussion: two imagined Liverpool–Manchester City and Liverpool–Arsenal contexts, person-authored play opinions, generated illustrative images, an example file/link treatment, agreement/disagreement counts, comments, and replies. A match referee rating remains secondary. All activity and images are explicitly labeled as invented; accounts, publishing, uploads, reactions, and comments are not functional. Academy has a bilingual publication-gated catalog at `/es/academy` and a direct-only editorial draft at `/es/academy/editorial-preview`. Nicolas approved the exact bilingual lesson and sources in chat; trusted reviewer admission and publication are still pending, so the public catalog is empty. Early Profile at `/es/profile` stores device preferences, can start or delete a private anonymous PostgreSQL session under the restricted `refview_app` login, and lists exact-version saved Academy lessons when available; simulator history remains honestly empty. The neutral controls preview reads device preferences, but the incident playtest does not yet. Assessment scoring and owned PostgreSQL attempts are verified against isolated synthetic test content; no scored item is live in the app. The local-only Assessment editorial preview at `/es/assessments/editorial-preview` shows the three unpublished candidates for review and closes when any candidate receives a review or publication transition.

## Visual and motion refinement

The home page links directly to the authored incident, neutral controls and clearly labeled local playtest. The authoring preview and local playtest now share the Quaternius rigged players Nicolas selected in the player audition, including generic numbered kits, hair and boots. Verified local resources and one absolute-tick pose adapter drive the seven players; authoring retains the previous procedural model as a comparison. Contact/fall constraints are a new visual candidate, not approved observation geometry. Spanish and English remain supported.

The RV-019B interface pass adds consistent navigation across the implemented site and a field-led authoring review. RV-019C makes the local playtest viewport-filling from entry: one deliberate action requests mouse capture and fullscreen, active play hides buttons and counters, and pause/completion controls live inside the field. RV-019D deepens the shared stadium into a populated two-tier bowl, adds fixed natural-green grass variation, refines the numbered players and referee, and improves the protected motion clips. The authoring route remains a review surface; the local run remains unsaved and unscored. See [interface verification](docs/features/12-site-interface-refinement/review.md), [immersive incident verification](docs/features/13-immersive-playtest/review.md), and [stadium/motion verification](docs/features/14-stadium-character-motion/review.md).

Open `/es/simulator/incident-preview` for deterministic authoring controls or `/es/simulator/incident-playtest` for the unsaved/unscored local run. These are not a published training attempt. The selected rigged resources, motion and renderer code require renewed training evidence. See [selected-player verification](docs/features/15-rigged-football-presentation/review.md) and [rigged presentation requirements](docs/features/15-rigged-football-presentation/requirements.md).

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

These commands assume the existing local databases and `apps/web/.env` are configured. For a fresh environment, `.env.example` identifies the required variables but its app password is a placeholder; provision distinct migration, app, and reviewer logins before using it. The current local `refview` and `refview_test` databases have thirteen applied migrations, including saved Academy lessons, the reviewer scope guard, and the private Community foundation. The web runtime uses `refview_app`, while migration and reviewer secrets are kept outside Next's environment file. `DATABASE_URL` targets the application database, `TEST_DATABASE_URL` targets only the isolated `_test` database, and `REFVIEW_APP_ORIGIN` names the exact browser origin. Migration commands require a separate `MIGRATION_DATABASE_URL`; they never fall back to the app credential. `docker compose down` stops this project's service and retains its named volume.

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
- [Shared domain contracts](docs/contracts/scenario.md)
- [First playable incident requirements](docs/features/01-playable-incident/requirements.md)
- [Source-backed first incident brief](docs/features/01-playable-incident/incident-brief.md)
- [Full product journeys](docs/product/journeys.md)
- [Delivery roadmap](docs/product/delivery-roadmap.md)
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
