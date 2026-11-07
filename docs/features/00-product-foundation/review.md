<a id="00-foundation"></a>

<a id="00-foundation--refview-foundation-review"></a>
## RefView foundation review

<a id="00-foundation--scope"></a>
## Scope

Read-only independent review of RV-001: root project policy, product definition, continuity records, canonical tracker, orchestration plan, architecture overview, initial ADRs, and the first playable-incident specification. This review did not examine application behavior because no application exists.

<a id="00-foundation--delegation-evidence"></a>
## Delegation evidence

- Reviewer creation: `collaboration.spawn_agent` returned `/root/foundation_review`.
- Requested model and effort: `gpt-6-sol`, `high`.
- Runtime-confirmed model and effort: unconfirmed; the runtime did not expose them.
- The reviewer returned a `FINAL_ANSWER`, remained read-only, and reported no file changes.

<a id="00-foundation--first-verdict"></a>
## First verdict

`FIX` with three consistency findings:

1. RV-002 linked different requirements in the canonical tracker and feature task contract.
2. First-incident MVP acceptance incorrectly depended on the later configurable-session milestone.
3. CHECKLOG used a task-status label that competed with the canonical tracker.

<a id="00-foundation--corrections"></a>
## Corrections

- RV-002 now links INC-REQ-001, INC-REQ-003, and INC-REQ-005 consistently.
- RV-011 now accepts the first-incident MVP after RV-009/RV-010; configurable sessions are RV-012 and follow RV-011.
- CHECKLOG describes the current phase and explicitly defers task status to `docs/specs/tasks.md`.

<a id="00-foundation--re-review"></a>
## Re-review

`collaboration.followup_task` requested re-review from the same read-only reviewer. A second `FINAL_ANSWER` reported `PASS` with no remaining findings. The reviewer confirmed that all local Markdown links resolved and `prompt.md` remained zero bytes.

<a id="00-foundation--final-verdict"></a>
## Final verdict

**PASS for RV-001.** This approves the recoverable planning and orchestration foundation only. It does not establish a runnable application, simulator quality, football-content validity, performance, persistence, or production readiness.

---

<a id="02-product-concept"></a>

<a id="02-product-concept--rv-018-review-evidence"></a>
## RV-018 review evidence

<a id="02-product-concept--supporting-state-slice-2026-11-04"></a>
## Supporting-state slice (2026-11-04)

The static prototype now has bilingual, explicitly illustrative scenario catalogue states: ready, loading, error, empty search and planned content. Each state offers an appropriate recovery action. Role selection persists in memory across the concept journey: main referee reaches the existing scenario, assistant reaches a planned-role explanation, and VAR reaches its labelled illustrative workspace. No simulated state claims a network request, scored attempt or playable assistant/VAR role. The six source/public HTML, JS and CSS files were byte-identical by SHA-256 after the final edit. `DESIGN.md` and the prototype README now acknowledge the existing Next.js shell and avoid claims of implemented Community match detail, Academy search or Profile preferences.

`playwright-cli -s=concept run-code --filename=artifacts/rv018-supporting-states-check.js` passed on the Next-served `/prototype/index.html`; `playwright-cli -s=concept run-code --filename=artifacts/rv018-source-supporting-states-check.js` passed on the standalone `http://127.0.0.1:4173/` source. Both returned `failures: []` and `errors: []` after the final edit. The scripts checked Spanish default, English switching within a loading state, ready/loading/error/retry, nonmatching search and clear, planned-content return, assistant/VAR boundaries, and the main scenario-to-briefing-to-live-to-debrief journey at 1440x1000 and 390x844. The mobile view had no horizontal overflow and retained a visible recovery action. Captures: `artifacts/rv018-planned-desktop.png`, `rv018-error-mobile.png`, and their standalone-source counterparts. A separate Playwright CLI regression on both served copies checked `rebote` search -> planned item -> return, confirming focus on the visible button, and measured zero horizontal overlap between the Coach button and Retry at 390x844.

The first independent Sol-high review returned FIX: the planned-only catalogue return focused a hidden heading, and the floating Coach overlapped a mobile recovery button by 28x12 px. The first correction exposed a keyboard regression by assigning `tabindex=-1` to the focused planned button. After the second correction, the reviewer verified that button remained in normal Tab order and returned PASS. The reviewer made no edits. Requested implementation Sol/medium and review Sol/high; runtime-confirmed identities remain `unconfirmed`.

After the initial implementation, `node --check docs/prototype/app.js`, root `pnpm lint`, root `pnpm typecheck` and root `pnpm build` passed. After the final JS/CSS correction, `node --check` and `pnpm build` passed again; the two complete Playwright CLI journeys and source/public SHA-256 comparison were repeated on final files. The static UI slice does not alter deterministic domain behavior, so no mirrored unit tests were added.

The scoped review does not verify all of RV-018. Community's second selector still does not switch match-specific content; Academy search and Profile preferences/saved links remain illustrative or inert. Some existing incidental labels and runtime messages need a complete bilingual audit. A full audit against the [Web Interface Guidelines](https://github.com/vercel-labs/web-interface-guidelines/blob/main/command.md) and final principal-journey review remain before CON-REQ-002/003 and RV-018 can be marked Verified. The current concept is not evidence of production gameplay, persistence or training content.

<a id="02-product-concept--principal-journey-truth-pass-2026-11-04"></a>
## Principal-journey truth pass (2026-11-04)

Academy search now filters its seven local topic buttons in the current language, chooses a visible topic, preserves the query when language changes, and provides a bilingual empty/clear state. Only Challenges exposes the existing guided challenge example, Law 12 reference and practice link. The other six topics show their selected title and lead as explicitly labelled previews, with the full-lesson material and practice control hidden. Community's second fictional match shows a planned-content explanation without changing the active first fixture, rating or discussion. Profile's unavailable attempt, saved examples and preferences are labelled static illustrations rather than dead links or editable settings.

`playwright-cli -s=concept run-code --filename=artifacts/rv018-truth-pass-check.js` passed on both the Next-served copy and the standalone source at desktop and 390x844 mobile widths: each result had `failures: []` and `errors: []`. Checks covered Spanish search, English query preservation and empty/clear, Offside preview versus complete Challenges material, planned Community explanation with unchanged first fixture, noninteractive illustrative Profile controls, and mobile overflow. A settled mobile Academy empty-state screenshot was visually inspected after the view transition. `node --check docs/prototype/app.js`, root `pnpm lint`, root `pnpm typecheck`, root `pnpm build`, and SHA-256 source/public parity passed after implementation; the production build was rerun after the final JS/CSS correction and passed.

Independent Sol-high review first returned FIX: choosing Offside changed only the title/lead while leaving the Challenges example, Law 12 aside and unrelated practice link visible. The coordinator corrected this truth gap and reran both browser flows. Sol-high read-only re-review returned PASS for the scoped correction, hidden keyboard semantics, language behavior and file parity; it did not independently rerun the browser journey. Requested implementer Sol/medium and reviewer Sol/high; runtime-confirmed identities remain `unconfirmed`.

RV-018 remains In review. The static prototype still needs a complete audit of incidental runtime labels/accessible names in Spanish and English and a final journey/design-guideline review. This slice does not implement production Academy content, accounts, distinct Community match data or saved preferences.
