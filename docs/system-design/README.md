# RefView system design diagrams

These standalone SVGs use the 1280 × 720 editorial visual language of the sibling [AI Engineering Projects review-system diagram](../../../ai-engineering-projects/projects/debate-proposal-review/system-design/overview.svg): warm paper, ink and muted text, cream cards, a restrained terracotta accent, thin orthogonal connectors, and system fonts. The reference supplied visual direction only. RefView's components and claims come from this repository.

| Diagram | What it explains |
| --- | --- |
| [System architecture](system-architecture.svg)         | Scenario source, compiler, browser presentation, and the intended attempt/evaluation/debrief boundaries. Planned wiring is labeled. |
| [Simulator scene hierarchy](simulator-scene-hierarchy.svg) | The Canvas, Three.Scene and the environment, seven players, referee, ball and camera branches. |
| [Pitch and stadium hierarchy](pitch-stadium-hierarchy.svg) | Grass, field markings, goals, stands, instanced crowd and lighting groups. |
| [Footballer rig hierarchy](footballer-rig-hierarchy.svg) | Independent actor root, cloned skeleton, bone chains, skinned garments and head attachments. |
| [Canonical tick render sequence](canonical-tick-render-sequence.svg) | How timeline state and referee motion become an immutable scene frame and WebGL render. |
| [Rigged pose pipeline](rigged-pose-pipeline.svg) | How actor tracks and distance-based gait become sampled clips, contact/fall corrections and a reproducible pose. |
| [Asset authoring pipeline](asset-authoring-pipeline.svg) | The proposed Blender-to-RefView asset workflow and the open review/publication gate. |

The companion [architecture and completion plan](../architecture/3d-simulator-authoring-and-completion.md) contains implementation detail and task references. The canonical task state remains in [`docs/specs/tasks.md`](../specs/tasks.md).

Regenerate all three diagrams from the checked-in source with:

```powershell
python docs/system-design/build.py
```

The script creates temporary self-contained HTML, runs `diagram-design`'s `self_check.py`, exports SVG through its `export_svg.py --system-fonts` helper, and removes the temporary HTML. It needs the locally installed `C:/Users/Nicolas/.agents/skills/diagram-design` skill. The SVGs remain self-contained and make no font or image network request.
