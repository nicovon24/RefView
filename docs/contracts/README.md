# Shared system contracts

The reusable contracts are grouped into six domain documents. Stable source contract IDs remain as anchors inside each document. Feature scope and acceptance stay under `docs/features/`; task status lives only in [`../specs/tasks.md`](../specs/tasks.md).

| Domain | Contents |
| --- | --- |
| [Application lifecycle](application-lifecycle.md) | Anonymous ownership, expiry, deletion, and device preferences. |
| [Learning and publication](learning-publication.md) | Academy content, Assessment authority, source compilation, and publication admission. |
| [Community](community.md) | Fictional read boundaries, social authority, visibility, and moderation. |
| [Simulator timeline](simulator-timeline.md) | Coordinates, authored scenarios, canonical events, clocks, sessions, and persistence. |
| [Observation and evaluation](observation-evaluation.md) | Camera evidence, observation traces, deterministic decisions, renderer identity, and review evidence. |
| [Simulator presentation](simulator-presentation.md) | Selected rig, motion, contact diagnostics, calibration, and visual candidate boundaries. |

The combined set and the canonical task tracker make eight primary specification documents. Add a section to an existing domain document when a contract belongs to that domain; preserve its stable anchor when editing it.
