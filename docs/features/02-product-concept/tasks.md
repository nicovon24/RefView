# Full-product concept task contracts

## RV-018 - Visual direction and interactive product concept

- Requirements: CON-REQ-001 through CON-REQ-007.
- Dependencies: current product journeys and reference register for the static concept; RV-004 runnable workspace for application integration.
- Ownership: coordinator owns the visual-direction decision and shared design system; bounded implementation may be delegated only after the direction is approved.
- Deliver: `DESIGN.md`, design tokens, bilingual responsive shell, and navigable principal screens for all product areas with honest fixture labels.
- Acceptance: Playwright CLI verifies journeys and responsive states; `web-design-guidelines` audit passes after fixes; visual review compares the result with the approved direction.
- Stop conditions: no approved visual direction, invented real-world claims, or concept code that presents mocked behavior as implemented.

The static concept was completed before RV-004 and remains in review for missing supporting states. Its design system must be integrated before RV-010 finalizes the simulator interface and before production Academy/Community surfaces inherit it.
