# Procedural player model refresh

Status is tracked only in `../../specs/tasks.md`.

## Objective and route

Bounded delegated SDD refinement of the seven visible incident players. Following RV-019, the user chose to continue with the established AI model allocation and the character work identified as the next visual priority. Preserve the existing RefView visual direction and all prior local changes.

## Acceptance

- **MODEL-REQ-001:** Authoring preview and unsaved local playtest use one feature-local visual player construction contract. The same actor has the same kit, silhouette, and pose at the same canonical tick in both views.
- **MODEL-REQ-002:** Players have clearly human proportions and recognizable football clothing at first- and third-person incident distances. Yellow attackers, blue defenders, and the goalkeeper remain distinguishable. Contact boot and falling attacker stay readable in A; B still screens decisive contact.
- **MODEL-REQ-003:** Model presentation follows the authored rig's joints, segments, root position, yaw, and clip sample. Seeking the same tick produces the same pose; model-only changes do not alter authored timeline, evidence anchors, occluder boxes, contact ground, scoring, or source asset bytes.
- **MODEL-REQ-004:** The local playtest still starts, pauses and resumes without renderer errors, and mounted model geometry/materials are disposed on unmount. Do not add heavy textures, shaders, postprocessing, or runtime asset fetches.
- **MODEL-REQ-005:** Targeted tests cover construction/parity and exact tick application; lint, typecheck, build and relevant content/web tests pass. Playwright CLI screenshots and a brief normal-speed recording at A/B contact and fall receive visual inspection and independent read-only review.

## Limits

The local player model is an original procedural visual, not a licensed external rig, mocap clip, AI-generated 3D asset, or claim of photorealism. Referee ghost, field, camera, decision flow, publication and persistence are outside this slice. The user has not approved training publication or saved scoring.

## Evidence and next step

Prior baseline: `artifacts/refresh-final-a-third-contact.png`, `refresh-final-fall-en.png`, `refresh-playtest-paused.png`. The current authoring JSX and imperative playtest separately construct cylinder/sphere/box players, which can drift. First freeze one visual-node contract and verify construction/parity before improving its geometry.
