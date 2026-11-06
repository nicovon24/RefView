---
name: RefView
description: Field-led football refereeing, with calm surfaces for evidence and learning.
colors:
  ink: "#10201d"
  night: "#0f1817"
  paper: "#f1f2ed"
  white: "#fff"
  lime: "#cfea55"
  lime-hover: "#dcf66f"
  teal: "#44b8b1"
  coral: "#b94236"
  blue: "#4d72d8"
  muted: "#4a5e58"
  line: "#cfd6d1"
  hud: "rgba(11,22,20,.9)"
typography:
  display:
    fontFamily: '"Barlow Condensed", "Arial Narrow", sans-serif'
    fontSize: "clamp(4.2rem,8vw,8rem)"
    fontWeight: 600
    lineHeight: 0.98
    letterSpacing: "-0.025em"
  headline:
    fontFamily: '"Barlow Condensed", "Arial Narrow", sans-serif'
    fontSize: "clamp(2.55rem,5vw,5.6rem)"
    fontWeight: 600
    lineHeight: 0.98
    letterSpacing: "-0.025em"
  title:
    fontFamily: '"Barlow Condensed", "Arial Narrow", sans-serif'
    fontSize: "clamp(1.8rem,3vw,3.1rem)"
    fontWeight: 600
    lineHeight: 0.98
    letterSpacing: "-0.025em"
  body:
    fontFamily: '"Source Sans 3", "Segoe UI", sans-serif'
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.48
  label:
    fontFamily: '"Source Sans 3", "Segoe UI", sans-serif'
    fontSize: "0.75rem"
    fontWeight: 800
rounded:
  square: "0px"
  keycap: "4px"
  hud: "5px"
  control: "6px"
  decision-panel: "10px"
  pill: "999px"
spacing:
  tight: "8px"
  compact: "12px"
  row: "16px"
  inset: "18px"
  panel: "22px"
  section: "24px"
  grid: "32px"
  reading: "44px"
components:
  button-primary:
    backgroundColor: "{colors.lime}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "13px 18px"
  button-primary-hover:
    backgroundColor: "{colors.lime-hover}"
  button-secondary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.control}"
    padding: "13px 18px"
  button-danger:
    backgroundColor: "{colors.coral}"
    textColor: "{colors.white}"
    rounded: "{rounded.control}"
    padding: "13px 18px"
  input-coach:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink}"
    padding: "11px"
  tag-live:
    backgroundColor: "{colors.lime}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "6px 9px"
  navigation-item:
    textColor: "#40514c"
    padding: "0 15px"
  decision-panel:
    backgroundColor: "{colors.hud}"
    textColor: "{colors.white}"
    rounded: "{rounded.decision-panel}"
    padding: "22px"
    width: "min(380px,calc(100vw - 44px))"
  profile-section:
    textColor: "{colors.ink}"
    rounded: "{rounded.square}"
    padding: "28px"
---

# Design System: RefView

## Overview

**Creative North Star: "Camera de partido"**

RefView is grounded in the referee's view of football: natural pitch colour, close attention to the incident, and compact controls that let the scene lead. Deep green-black chrome, off-white reading surfaces, lime selections, turquoise cues, and restrained coral decisions connect the product. The tone is direct, composed, and practical.

The interface changes density with the task. Simulator controls sit at the edge of the scene; learning, discussion, and review use generous light surfaces, strong condensed headings, readable body text, and ruled sections. Branding stays replaceable: the name and original circular mark are identity elements, while semantic colour roles, typography roles, layout, and accessible interaction remain independent.

**Key Characteristics:**

- Field-led composition with compact, high-opacity controls.
- Condensed display typography paired with open, readable body typography.
- Flat, ruled reading surfaces and selective overlay elevation.
- Visible distinctions between authored evidence, interpretation, and illustrative content.
- Spanish-first content with complete English counterparts.

This is a scan of the static prototype in [`docs/prototype/`](docs/prototype/README.md), using its CSS cascade and recorded desktop/mobile renders at that review checkpoint. The supplied finish-review disposition was SHIP for that prototype, not production acceptance. The Next.js application now implements the shared site shell, home route, and local simulator previews; the remaining Academy, Community, Assessment, Profile, and Coach concept journeys are still illustrative. This file records visual guidance, not task status. The detailed surface composition remains in the [surface brief](.impeccable/surfaces/docs-prototype-index-html.md).

## Colors

The palette combines natural football imagery with quiet green neutrals and a small set of functional accents. Frontmatter values reflect the final readability overrides, not earlier declarations in the stylesheet.

### Primary

- **Selection Lime (`lime`):** primary actions, selected decision options, camera state, timeline playhead, and the original brand mark. The lighter hover variant belongs to primary buttons.

### Secondary

- **Referee Turquoise (`teal`):** progress and distribution bars, native range controls, and the visual connection to the referee kit in the concept imagery. It is not the default body-text colour.

### Tertiary

- **Decision Coral (`coral`):** consequential decision actions and review-event markers. It does not imply a red card or prove that a decision is wrong.
- **Focus Blue (`blue`):** visible keyboard focus. Preserve this independent accessibility role when revising the brand palette.

### Neutral

- **Field Ink (`ink`):** text, selected rows, secondary actions, and strong reading-surface separators.
- **Stadium Night (`night`):** simulator, briefing, replay, and dark supporting surfaces.
- **Reading Paper (`paper`):** the application shell and long-form surfaces.
- **White (`white`):** dark-surface text and input/message surfaces.
- **Quiet Green (`muted`):** secondary copy on light surfaces.
- **Rule Line (`line`):** one-pixel dividers, section boundaries, and restrained control borders.
- **HUD Shade (`hud`):** high-opacity green-black plates over imagery. The photograph must never be the only background protecting control legibility.

**The State Plus Label Rule.** Selection, warning, and availability must have a textual or structural cue as well as colour.

## Typography

Barlow Condensed supplies the display, heading, and large-number voice; Source Sans 3 supplies body copy, controls, metadata, and keycaps. Both are self-hosted with `font-display: swap`. The shipped heading file is semibold (600), and `font-synthesis: none` prevents fabricated weights. Source Sans 3 is declared across weights 300–800. Font roles in frontmatter describe these actual faces, even where browser heading defaults request a heavier weight.

Use the display role for the image-led home heading, headline for ordinary page hierarchy, title for section headings, and body for instructions and explanations. Individual pages intentionally override heading sizes; this is not a mathematically fixed type scale. Keep paragraphs to the implemented maximum of 72 characters (`72ch`). Headings use balanced wrapping and tight line height; long instructions must use body typography instead.

Functional labels are compact and bold. The final readability pass raises major HUD and status microcopy to the label role. Uppercase letterspacing is reserved for short state/provenance labels, not sentences. Times, replay positions, and scoreboard values use tabular numbers. Redundant section eyebrows are hidden; prototype, fictional, and prepared-response disclosures remain visible where they communicate content truth.

## Layout

Reading views use a centred container capped at 1600px, with responsive horizontal padding `clamp(20px,5vw,72px)` and vertical padding `clamp(38px,6vw,84px)`. The desktop header is 68px high and sticky. Use shared edges, one-pixel rules, and purposeful columns rather than nesting every section inside a card. Common spacing is captured in frontmatter; the prototype is an observed spacing vocabulary, not an enforced universal grid.

Simulator and replay surfaces favour wide imagery with edge-mounted controls. Actual live mode occupies `100vh`, hides global navigation and the Coach launcher, and places time at top centre, communications at upper left, camera at upper right, and the decision action at lower right. The underlying image uses cover cropping; this static implementation is not locked to 16:9 despite that target in the direction brief. The centre must remain readable for the incident.

Debrief separates the evidence player from a learning column (`1.45fr / .55fr`, with a 320px minimum learning width). Its score band keeps decision, observation, communication, and protocol separate. Academy uses topic navigation, lesson, and reference columns (190px / flexible / 260px). Community uses a 320px rating column beside discussion. These are reusable relationships, not mandatory dimensions for every page.

Responsive behaviour is explicit:

- At 1100px and below, replace desktop navigation with a menu; stack briefing, debrief, and assessment sections. Academy keeps two columns and moves the reference beneath the lesson. The VAR concept hides its second feed at this breakpoint; do not claim simultaneous evidence comparison on that layout.
- At 760px and below, use a 60px header, 18px content gutters, and mostly single-column content. Academy topics become a horizontal scroller. Answer choices and evidence timeline rows stack; the score band becomes two columns. Profile and Community sections stack.
- The home ribbon becomes two columns; the hero actions stack. The Coach drawer fits `min(440px,100vw)` and long comments/messages wrap.
- On mobile the simulator displays a desktop-control limitation note and hides movement key hints. The decision panel spans the viewport with 12px side insets. This is a responsive concept view, not evidence of playable touch controls.
- The body minimum width is 320px. Preserve text wrapping and grid `min-width:0` safeguards; do not hide inaccessible content merely to conceal overflow.

## Elevation & Depth

Reading surfaces are predominantly flat. Rules, spacing, and tonal changes create hierarchy. Shadows are reserved for overlays and components that float above another surface: HUD plates, mobile navigation, Coach launcher/drawer, messages, and toast feedback. There is no general elevated-card grid or frosted-glass material.

The source defines a shared overlay shadow (`0 12px 32px rgba(8,20,17,.16)`), HUD shadow (`0 8px 24px rgba(0,0,0,.16)`), Coach launcher shadow (`0 8px 26px rgba(9,20,17,.25)`), drawer shadow (`-16px 0 38px rgba(7,17,15,.22)`), and message shadow (`0 6px 16px rgba(10,22,18,.07)`). Full values live in the sidecar extensions for consumers that cannot encode them in frontmatter.

## Shapes

The system is rectangular with modest control rounding. Use the control radius for standard buttons; smaller HUD/keycap radii for dense operational controls; the larger decision-panel radius for its compact floating surface. Broad reading sections retain square edges. Pills belong to short tags, language selection, reaction buttons, communications, and the Coach launcher. Circles belong to avatars, state dots, and the original identity mark.

The stylesheet contains a declared 14px root radius that is not used as a general component rule. Do not promote that unused declaration into a global rounded-card treatment. The original mark is a ring crossed by a diagonal stroke, with a matching repository-authored favicon; keep it isolated from information hierarchy so identity can change without redesigning workflows.

## Components

### Actions and state controls

Standard buttons are bold, compact rectangles with a minimum height of 46px. Primary actions use lime/ink; secondary actions use ink/paper; consequential actions use coral/white. Hover raises a standard button by 2px over 200ms and lightens primary lime. Text actions use an underline instead of an enclosing plate. Dark ghost actions use a translucent dark fill and a light border.

Disabled controls retain the native disabled state, a not-allowed cursor, and opacity `.46`. Selected choices use a strong fill and border change. The static prototype's smaller transport and metadata controls do not all meet a 44px target; the standard-button minimum must not be reported as universal coverage.

### Fields, tags, and ruled sections

Use native inputs, selects, ranges, checkboxes, textarea, and disclosure elements with visible labels. Search uses an open, bottom-rule treatment. Text entry uses white on light surfaces and dark green on dark surfaces, with clear borders; textarea remains vertically resizable. Selected range/checkbox accents use lime on simulator surfaces and turquoise on reading surfaces. Validation/error states beyond the demonstrated prototype are not a documented component library yet.

Tags are compact pills for brief status, never a substitute for explanatory copy. Profile sections, learning rows, community comments, and evidence rows use spacing and dividers. The shared container pattern is a ruled section rather than a generic rounded card.

### Navigation and accessibility

Desktop navigation uses a bottom rule on active/hover state, with a 250ms scale transition. The mobile menu is a light, full-width panel beneath the header. Preserve the skip link, semantic headings, labelled landmarks and fields, visible focus, keyboard-operable native controls, and meaningful image alternatives. The global focus treatment is a 3px solid focus-blue outline with 3px offset.

View changes focus the destination heading. The Coach drawer contains keyboard focus, closes on Escape, and restores focus to its opener. A mobile menu exposes its expanded state. These observed behaviours are component requirements to preserve; they do not constitute a complete accessibility certification.

### Simulator, decision, and evidence

The HUD presents only the information needed during the incident: camera, match time, communication, controls, and decision. Visible labels explain camera and state. The `C` shortcut and visible camera button switch between the two concept images; a distance control demonstrates framing changes. The selected production direction now also starts behind the referee, with first-person toggle and adjustable framing. The playable scene must validate comfort and ensure a camera offset cannot earn observation credit for evidence the referee could not perceive.

The decision panel groups stop/play-on, restart, and discipline. Debrief presents proposed facts, interpretation, evidence limits, rule reference, and next practice. Do not display invented evaluation scores: the prototype leaves unmeasured dimensions unmeasured. Its contact overlay is hidden because an illustration is not validated contact evidence. The VAR workspace visibly identifies itself as illustrative and uses independent stills; matching displayed timecodes do not prove synchronized replay.

### Coach and content truth

The Coach is a bounded side drawer with context, messages, prepared prompts, and an entry field. Its launcher recedes during live play. Label prepared-response mode and explain unsupported questions. Coach text must never suggest it inspected a video, recorded a position, or scored an attempt when it did not.

Spanish is the default locale; English switches all meaningful interface text, labels, feedback, and image alternatives. Retain natural Spanish voseo where used and test the longer translation in the same component. Technical documentation and identifiers remain English. Fictional Community matches and profile fixtures need visible disclosure. Rule editions and source links accompany learning claims; provisional football interpretation remains labelled as proposed until accepted.

### Motion

Motion supports state changes: view entrance is 500ms with an 8px upward settling motion; the Coach drawer enters over 400ms; role imagery scales to 1.025 over 700ms; camera image framing/filter changes take 350ms. The shared settling curve is `cubic-bezier(.16,1,.3,1)`. Avoid looping ornamental movement near the incident.

The implemented reduced-motion rule removes view/drawer entrance animations, role-image transitions, button transitions, and smooth scrolling. It does not currently remove every transition (notably camera-image and navigation transitions); do not claim a full motion opt-out. New motion should respect the preference and must not imply that the static scene is a running simulation.

### Asset provenance

Use the [asset register](docs/prototype/assets/README.md) as the provenance entry point. The two shipping scene PNGs were generated for RefView with fictional teams and stadiums; prompts are preserved in `.impeccable/prompts/` and embedded in each PNG. They establish framing and visual ambition, not animation, physics, occlusion, or replay evidence. Keep that distinction visible wherever reused.

Barlow Condensed and Source Sans 3 originate from the Google Fonts repository under SIL Open Font License 1.1; their separate copyright notices and license copies are in `docs/prototype/assets/OFL.txt` and `docs/prototype/assets/OFL-SourceSans3.txt`. The favicon and circular mark were authored for the prototype. No reference-product branding, teams, kits, characters, stadium, footage, or broadcast package is approved for copying. External references and RefView inferences are distinguished in the [prototype reference register](docs/prototype/README.md#references). No external animation or audio is shipped by this prototype.

## Do's and Don'ts

### Do:

- Do preserve semantic colour and type roles so the brand can change independently of the workflows.
- Do keep incident imagery dominant during simulator use and reading surfaces calm outside it.
- Do keep fictional, illustrative, proposed, and prepared-response disclosures close to the affected content.
- Do test Spanish and English, keyboard focus, and narrow layouts after component changes.
- Do preserve asset origins, licenses, and generation prompts when replacing or reusing visual material.

### Don't:

- Don't present generated stills or matching timecodes as validated live 3D or synchronized evidence.
- Don't invent scores, observation measurements, or AI capabilities to make the interface appear complete.
- Don't encode a decision or availability state with colour alone.
- Don't turn quiet reading sections into a dense grid of elevated rounded cards.
- Don't treat prototype review as production gameplay, persistence, accessibility, or training-content acceptance.
