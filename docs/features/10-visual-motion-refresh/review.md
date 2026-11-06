# Visual and motion refinement evidence

## Scope and delegation

User requested orchestration and confirmed 3D/simulator first, with home/navigation improvements. The coordinator preserved pre-existing local work and owns this record. Runtime creation and handoffs were observed for:

| Agent task | Scope | Requested identity | Runtime-confirmed identity |
| --- | --- | --- | --- |
| `/root/animation_assessment` | Read-only motion diagnosis | gpt-6-luna / high | unconfirmed |
| `/root/home_refresh` | Home and navigation, exclusive home paths | gpt-6-sol / medium | unconfirmed |
| `/root/motion_implementation` | Original procedural assets, mirrors, hash bindings and TDD | gpt-6-sol / medium | unconfirmed |
| `/root/impeccable_finish_reviewer` | Independent final read-only review | gpt-6-sol / high | unconfirmed |

The coordinator changed authoring UI/CSS and player mesh appearance in authoring/playtest. Body joints, canonical roots, events, facts and clip schedule remain unchanged. New clip/rig bytes change the source hash; old calibration/render approval does not approve this candidate.

## TDD and integration commands

- Worker: new articulated motion assertions first failed in three cases (foot lift, support-knee bend, hand brace). Implementation also exposed and corrected an onside-depth regression and a run-to-fall wrist discontinuity. `pnpm --filter @refview/content test`: 77/77 after correction; content and web typecheck passed; public/source asset bytes matched.
- Coordinator: `pnpm test` passed domain 87, simulation 78 and content 77; web initially failed 8 fingerprint checks because authoring CSS referenced fonts outside the renderer manifest. Removed that new dependency from the authoring workspace; operational controls retain system typography. Home uses the already bundled OFL fonts with existing notices.
- After correction, `pnpm --filter @refview/web test`: 58/58. Combined current package suites: 300 passed.
- `pnpm lint`, `pnpm typecheck`, `pnpm build`: passed. Build generated both locales and all existing preview routes.
- No persistence/schema change; PostgreSQL tests were not repeated for this presentation-only iteration.

## Browser and visual evidence

Playwright CLI, local development server, Chrome, Windows; desktop 1440x900, mobile 390x844, fullscreen 1280x720. No FPS claim. `artifacts/refresh-browser-check.js` contains the executed interaction/capture sequence.

- `playwright-cli -s=visual-refresh run-code --filename=artifacts/refresh-browser-check.js`: ES/EN home desktop/mobile, no horizontal overflow, A/B viewpoints, first/third person, pass tick 120, reset tick 0, contact tick 366, fall tick 386, fullscreen and reduced-motion assertions completed without errors.
- Home captures: `artifacts/refresh-final-home-{es,en}-{desktop,mobile}.png`. Keyboard Tab reached the skip link; reduced-motion primary transition was `0s`.
- Scene captures: `refresh-final-a-first-contact.png`, `refresh-final-a-third-contact.png`, `refresh-final-b-first-contact.png`, `refresh-final-pass.png`, `refresh-final-fall-en.png`, `refresh-final-workspace-en-mobile.png` under `artifacts/`.
- Fullscreen captures: `refresh-final-fullscreen-contact.png`, `refresh-final-fullscreen-end.png`. The earlier `refresh-final-fullscreen.png` was taken before the resize render settled and is invalid/superseded; it is not acceptance evidence.
- `playwright-cli -s=visual-refresh video-start artifacts/refresh-final-motion.webm`, play from tick 345, wait for tick 480, `video-stop`: recorded at normal playback speed. Chromium-decoded samples at 0.8..3.0 seconds in 0.2-second steps are in `refresh-motion-sample-00.png` through `-11.png`; `refresh-motion-sequence.png` is the contact sheet. The coordinator visually inspected the sequence, contact and fall. This is sampled visual inspection of a normal-speed recording, not a claim of watching every video frame.
- Browser console reported zero errors for the refreshed home/authoring routes; existing development warnings remain. No saved attempt or training publication was created.

## Limitations

Procedural characters remain stylized; this iteration does not provide motion-capture animation, root-speed-coupled gait, new actor heading trajectories or a final photorealistic character system. Full training acceptance, source/build/evidence attestation and scoring remain separate milestones. Existing DESIGN.md describes the prototype and contains pre-existing historical drift; this refinement does not replace its token system.

## Independent review

`/root/impeccable_finish_reviewer` returned **SHIP** for this iteration. The reviewer inspected every requested desktop/mobile/camera/fullscreen capture, the sampled motion contact sheet and three original video frames. It found contact readable in A, screening retained in B, and continuous fall, with no material regression. It independently verified all four source/public/manifest asset hashes and ran `pnpm --filter @refview/content exec vitest run src/articulated-asset-v2.test.ts`: 7/7.

The sole P3 note is the 10px home scene badge (`apps/web/src/features/home/home.css`), smaller than the documented 0.75rem label. This nonblocking polish item remains unchanged after review. The reviewer ran one Impeccable detector pass; palette/type-ramp advisories did not become material visual findings. Broader integration gates were reported by the coordinator, not rerun by the reviewer. The reviewed scope is this presentation/motion iteration, not MVP or training acceptance.

Additional local playtest smoke: Playwright clicked `Iniciar con mouse`, pressed Escape, and verified `En pausa` at tick 59 with zero console errors; `artifacts/refresh-playtest-paused.png`. This exercises existing local-run integration with the updated asset bytes and mesh appearance without creating a saved attempt.

Canonical task status remains in `../../specs/tasks.md`.


## Design documentation verification

`/root/impeccable_documenter` completed an independent read-only comparison against PRODUCT.md, DESIGN.md, `.impeccable/design.json`, final home/authoring styles and bundled asset notices. Requested gpt-6-sol / high; runtime-confirmed unconfirmed. It found no material documentation gap and confirmed this is an extension of the established system. It verified OFL font provenance, RefView-owned procedural assets, bilingual routes and unpublished/unsaved/unscored disclosures. The historical statement that the production app is absent in DESIGN.md is pre-existing prototype documentation drift, recorded without rewriting the design system. No design-system file was changed.


Reviewer detector command (PowerShell, repository root; stdout only, no saved output artifact):

```powershell
& 'C:/Users/Nicolas/.codex/skills/impeccable/scripts/impeccable.cmd' detect --json 'apps/web/src/app/[locale]/page.tsx' 'apps/web/src/features/home/home.css' 'apps/web/src/features/home/copy.ts' 'apps/web/src/features/simulator/incident/IncidentPreview.tsx' 'apps/web/src/features/simulator/incident/incident.css'
```

The build-generated `next-env.d.ts` route import paths were restored to their pre-task development form; `pnpm --filter @refview/web typecheck` passed again afterward. Temporary browser evidence sessions and the artifact-only HTTP server were closed; the existing application server was preserved.
