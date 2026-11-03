# Technology stack decision

## Selected starting stack

| Concern | Choice | Why now | Boundary |
| --- | --- | --- | --- |
| Web product | Next.js App Router, React, strict TypeScript | One deployable product shell with server rendering and client 3D | Not the simulation clock or game authority |
| Reads and mutations | Server Components for reads; Server Actions for owner-validated same-origin mutations; Route Handlers for streaming/external HTTP | Keeps ordinary app work close to the feature without inventing a separate backend | No per-frame Server Actions |
| Database | PostgreSQL | Correct transactional/constraint behavior and an affordable local/hosted path | No event store for authored ticks |
| ORM | Prisma ORM 7, exact stable version | Strong schema/migration workflow and the user's chosen ORM | Domain contracts do not import generated Prisma types |
| UI primitives | Radix Primitives | Accessible behavior without adopting another product's visual defaults | RefView owns styling and composition |
| Styling | Tailwind CSS plus CVA | Fast tokenized composition and typed variants | Avoid a large generic utility-component layer |
| Shared components | `apps/web/src/components` | One predictable home for application-wide components | Feature-only pieces remain under `features/<feature>` |
| 3D rendering | Three.js through React Three Fiber and Drei | Browser-native rendering integrated with React | Renderer samples canonical state; it does not create facts |
| Movement/collision | Rapier | Referee locomotion and static collision support | Not authoritative for authored player/ball events |
| Workflow | XState | Explicit recoverable simulator states and guarded transitions | It does not own a competing clock |
| Runtime contracts | Zod | Validate authored content and trust-boundary payloads | Static TypeScript types alone are insufficient at boundaries |
| Unit/integration tests | Vitest | Fast TDD for pure/domain/application code | Persistence evidence uses real PostgreSQL |
| Browser acceptance | Playwright CLI | Required project standard for flows, viewports, and screenshots | Visual WebGL acceptance still needs human inspection |

## Radix rather than shadcn/ui

Start with Radix Primitives directly. shadcn/ui is useful source code, not a runtime framework, but its copied component layer would create a second styling baseline before RefView's identity is settled. Direct Radix gives accessible dialogs, menus, tabs, sliders, and focus behavior while RefView owns typography, spacing, controls, and sports-specific composition.

This is not a permanent ban. A specific shadcn implementation may be studied or selectively adapted later if it saves verified work without importing a conflicting visual system.

## Component placement

```text
apps/web/src/
  app/                         # routes, layouts, server boundaries
  components/                  # shared RefView application components
    ui/                        # low-level styled Radix wrappers
    layout/                    # navigation, shells, responsive frames
    feedback/                  # loading, error, empty, status
  features/
    simulator/
      components/              # simulator-only HUD, decision, replay UI
      scene/                   # R3F rendering and adapters
      state/                   # XState integration
    academy/
    community/
    assessments/
    profile/
  lib/                         # application adapters, i18n, server helpers
packages/
  domain/                      # framework-free contracts and rules
  simulation/                  # deterministic playback/observation
  content/                     # authored scenario validation/projections
  data/                        # Prisma repositories and transactions
```

`components` is the correct shared folder. It should not become a dumping ground: if a component only makes sense inside the simulator, it stays with the simulator.

## Cost and scale position

The authored-sequence approach is possible without AI and without high infrastructure cost:

- Static scenario tracks run in the browser.
- PostgreSQL stores versions, attempts, and results rather than frames.
- Deterministic TypeScript evaluates decisions.
- A single Next.js deployment can serve the early product.
- AI remains optional and can be disabled or replaced by prepared responses.

More actors and several-minute sequences increase authoring, animation, memory, and browser-performance cost, not necessarily server cost. Configurable session duration should initially compose authored incidents with explicit time jumps. Continuous autonomous matches would require a different gameplay/AI investment and remain optional research.
