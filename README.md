# RefView

RefView is a Spanish-first, bilingual football refereeing platform. Its first implementation milestone is a playable, deterministic 3D incident in a desktop browser, followed by authored configurable sessions and the wider Academy, Community, Assessments, and Profile journeys.

## Status

The repository contains product, architecture, and SDD planning plus a runnable static design prototype. There is no Next.js application or playable 3D scene yet.

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

Application run instructions will be added after the application workspace exists.

The next implementation gate is application bootstrap and a controllable referee scene. Nicolas must approve or correct the proposed football brief before it becomes accepted training content; the shared contracts have passed independent review but await that content decision before they are frozen.
