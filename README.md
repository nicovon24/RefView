# RefView

RefView is a Spanish-first, bilingual football refereeing platform. Its first implementation milestone is a playable, deterministic 3D incident in a desktop browser, followed by authored configurable sessions and the wider Academy, Community, Assessments, and Profile journeys.

## Status

The repository contains product, architecture, and SDD planning, a runnable static design prototype, and an initial Next.js application foundation. The application renders a neutral WebGL field, not a playable incident. There are no authored players, referee controls, decisions, scoring, attempt records, or AI requests yet.

## Run the application foundation

Use Node.js 24 and pnpm 10.33.2. Docker is needed for the PostgreSQL smoke test. In PowerShell from the repository root:

```powershell
pnpm install --frozen-lockfile
Copy-Item .env.example apps/web/.env
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

Open `http://127.0.0.1:3000` (redirects to Spanish `/es`) or `/en`. The full static concept is also available from the application at `/prototype/index.html`. `TEST_DATABASE_URL` must point to a reachable PostgreSQL instance; the DB test fails rather than silently substituting SQLite or mocks. `docker compose down` stops only this project's service and retains its named volume.

For a browser smoke check with Playwright CLI, leave `pnpm dev` running in one terminal and use a second terminal:

```powershell
playwright-cli open http://127.0.0.1:3000 --browser=chrome
playwright-cli snapshot
playwright-cli click "getByRole('link', { name: 'EN' })"
playwright-cli resize 390 844
playwright-cli screenshot
playwright-cli close
```

Confirm the Spanish root redirect, English text and `lang="en"`, a visible 3D field and ready message, and no horizontal mobile overflow. The actual browser check on 2026-11-03 used Headless Chrome 156 on Windows with an AMD Radeon RX 6700 XT, 16 GB RAM, at 1280×720 and 390×844. WebGL2 was available; no simulator frame-time or FPS claim is made from this neutral static field.

The app currently uses a separate local PostgreSQL service on `127.0.0.1:55439`. No migration or application model exists. Generated Prisma code is ignored and must be regenerated after installation. Canvas loading and ready states were observed in Chrome; the unsupported-WebGL state was checked by disabling browser WebGL contexts. The rendering-error message is implemented but has not been exercised.

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

The next implementation gate is the deterministic timeline and observation core followed by a controllable referee scene. Nicolas must approve or correct the proposed football brief before it becomes accepted training content; the shared contracts have passed independent review but await that content decision before they are frozen.
