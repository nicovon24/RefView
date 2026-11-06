# Player model design

## Direction

Keep a restrained, original stylized footballer. Improve shoulder/waist shape, limbs, boots, hair and kit details enough to read at actual incident scale. Use standard Three.js geometry and materials already installed. The authored procedural rig still places every joint and segment. Rendering adds decorative surfaces to those nodes; it never creates football facts.

## Ownership boundary

A feature-local model factory creates the root, named joint/segment nodes, boots, and original kit details. Authoring and local playtest both instantiate it. The exact-scene adapter continues validating the public canonical frame and applies transforms only after validation. No source asset, hash, event, camera, C1/C2, scoring, database or global design contract changes. The coordinator owns specs, integration, browser evidence and tracker.

## Invariants and risk

- Preserve existing `ActorSceneNodes` shape and exact-scene rejection paths, render ordering and tick ownership.
- Preserve joint positions and segment lengths from `samplePlayerGeometry`; cosmetic child meshes can move only as descendants of the authored nodes.
- New clothing volume must not materially expand actor silhouette through the reviewed contact region or make B's occlusion visually false. Inspect A/B at fixed tick 366 and the falling attacker at 386 plus normal-speed playback.
- Keep per-actor material/geometry ownership explicit; playtest cleanup disposes generated resources exactly once. Avoid module-wide shared Three.js resources that an individual scene could dispose while another scene uses them.
- An authoring renderer source edit changes the renderer fingerprint even with unchanged authored source bytes. Historic capture/approval remains historical and training attestation must be renewed separately.

## Alternatives considered

External GLTF/mocap assets would require license, coordinate and skeleton retargeting, and renewed evidence geometry. This bounded pass uses authored procedural geometry already wired to the canonical timeline. A fuller character pipeline can follow after the training flow is proven.
