# Academy and Community icon controls

## Scope and acceptance

This small interface refinement replaces the Community preview's written agreement, disagreement and comment counts with authored SVG icons plus counts. Each visual tooltip names the metric on hover or keyboard focus, and each focusable statistic has a localized accessible name containing its count. These remain read-only illustrative counts; the icons do not imply working reactions or comments.

Academy's return links use one authored left-arrow SVG in a 44 by 44 pixel link across Law, topic, lesson, unavailable-lesson and direct editorial preview views. Their localized accessible names and destinations remain specific to the view. The shared visual treatment follows RefView's existing reading-surface palette.

## Verification

`pnpm --filter @refview/web typecheck`, scoped ESLint on the changed TSX files and `git diff --check` exited 0 after the final edits. Playwright CLI inspected Community and the five Academy return contexts in Spanish and English at 1280 and 390 pixel widths. The three Community labels and counts were localized, the focus tooltip reached full opacity, all return links were 44 by 44 pixels with the intended accessible name and destination, and no page gained document-level horizontal overflow. The topic return link was clicked and navigated to its Law. The Community metric row and Academy arrow were visually inspected. No automated tests were added or run for this presentation-only change.
