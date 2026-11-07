---
version: 1
slug: "rc-app-locale-simulator-controls-page-tsx-a074daca"
primary_target: "apps/web/src/app/[locale]/simulator/controls/page.tsx"
related_targets: []
---

# RV-007A controls preview surface brief

This is a local extension of the established RefView design direction in `DESIGN.md`, not a new identity or the final simulator screen. Use an **Operate** mode: a desktop user should understand how to enter, move, look, pause, re-enter, and adjust the camera within seconds. A neutral field occupies most of the viewport. Controls and state feedback sit at the edges with restrained broadcast-like visual weight. Use the existing pitch green, paper, lime, teal, and coral system with high contrast; avoid decorative cards that shrink the playing area.

The route is `/[locale]/simulator/controls`, Spanish first with a complete English alternative. State plainly that this is a technical controls preview: it has no authored incident, scored observation, decision, replay, or saved attempt. On a narrow viewport, show a responsive explanation that desktop keyboard/mouse play is required; do not imply mobile controls exist. Loading, WebGL failure, lost focus, released pointer lock, and paused states need distinct, recoverable feedback. Keyboard help, camera mode/distance/lateral framing, sensitivity/invert-Y, and reduced motion should be discoverable without obscuring the field.

The visible referee and camera must move coherently on a metric neutral pitch. The interface must not ingest a private scenario fixture or evidence definition. Meaningful pure input/camera behavior is tested at fixed ticks; visual comfort and browser interactions are checked separately. Do not borrow Premier League Player branding, layouts, characters, stadiums, footage, or assets.

Acceptance questions: Can a first-time user start and stop controls reliably? Does changing position or framing visibly change the view? Is orientation stable when pausing, losing focus, or recapturing the pointer? Are Spanish/English and desktop-only limits clear? Is the page still readable at mobile width without pretending mobile play works?
