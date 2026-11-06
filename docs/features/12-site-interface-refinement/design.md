# Interface direction and boundaries

## Decision

Extend RefView's established "Cámara de partido" visual language. The first viewport of the simulator is a field-led working surface: quiet, compact navigation; the 3D frame; one readable transport strip; grouped camera/position controls; and a precise state/provenance line. Home introduces the real incident instead of implying the neutral field is the incident. The playtest uses the same shell but keeps the field and immediate controls visible before optional adjustments. The neutral controls route remains explicitly technical.

## Shared presentation contract

The coordinator owns a pure presentational `SiteHeader` in `apps/web/src/components/site/` with `locale`, `active` route and optional `title` props. It supplies one brand/home link, implemented home/incident/playtest/controls navigation and locale-preserving language links. Its CSS may define shared color/spacing primitives, but must not import fonts or external assets. The existing home keeps its bundled licensed display/body fonts; operational simulator routes keep system fonts because introducing font URLs into authoring CSS previously broke renderer asset-closure tests. Feature CSS owns route-specific workspaces and states.

## Invariants and risk

- Preserve all simulator facts and 3D evidence geometry. Presentation overlays and labels cannot mask decisive contact at reviewed A/B ticks; compare fixed-tick screenshots before and after.
- Do not change the canonical frame source or playtest controller. Do not present an unsaved local run as a published or evaluated attempt.
- At 1280×720, leave enough vertical room for immediate playtest controls. Use actual viewport measurements rather than only DOM presence.
- Mobile authoring may offer review controls, but local playtest and neutral WASD controls remain desktop-only. Their mobile state must be useful and truthful.
- Reduced-motion preference removes decorative transitions; it does not alter authored animation or tick cadence.
- Shared header integration changes UI render source and requires renewed source/build/capture evidence before training publication.

## Alternatives

A new visual identity or static prototype-wide rebuild would discard settled design work and expand into illustrative future features. This iteration improves the four implemented routes. New scoring, publishing, AI Coach, external imagery and licensed UI assets are excluded.
