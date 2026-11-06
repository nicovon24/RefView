# Local incident renderer fingerprint v1

This contract identifies local rendering inputs for retrospective comparison with Nicolas's scoped first-incident scene response. It is a rendering-input identity, not proof of the code loaded by a development server, an emitted Next build hash, authenticated approval, or a production deployment credential. It cannot authorize reviewed catalog/start reads. Nicolas's seven rendered-review answers are recorded as conversation evidence; publication remains draft while trusted attribution/import, calibration acceptance, and a separate immutable running-build identity are incomplete.

## Manifest and digest

The server compiles `incident-001` version 1 from the canonical source with verified asset bytes. It derives `sourceContentHash` and `playableProjectionHash`; the latter is SHA-256 over UTF-8 canonical JSON of `["refview-playable-v1", compiled.playable]`. The manifest has exact keys `schemaVersion: 1`, those two hashes, `execution: { nodeVersion, pnpmVersion, mode: "development", sessionTestMode: false }`, and `files: [{ path, byteLength, sha256 }]`. The full fingerprint is SHA-256 over UTF-8 canonical JSON of `["refview-renderer-input-v1", manifest]`.

Canonical JSON sorts object keys ordinally, preserves array order and string bytes, normalizes negative zero, rejects nonfinite numbers, undefined, functions, sparse arrays, and non-JSON objects. Manifest file paths use repository-relative forward slashes, are sorted ordinally, and are unique case-insensitively. Hash exact file bytes; never normalize line endings. Reject missing files, symlinks, path escape, duplicate/case-colliding paths, and any mismatch between canonical asset bytes and the served public counterpart. The manifest is recomputed from fixed membership, not supplied by the browser.

Fixed v1 configuration and browser entrypoint membership:

```text
apps/web/src/features/simulator/incident/IncidentPreview.tsx
apps/web/src/features/simulator/incident/incident.css
apps/web/src/features/simulator/incident/load-incident.ts
apps/web/src/features/simulator/controls/controls.ts
apps/web/src/app/[locale]/simulator/incident-preview/page.tsx
apps/web/src/app/[locale]/layout.tsx
apps/web/src/app/globals.css
apps/web/src/lib/i18n/locale.ts
apps/web/next.config.ts
apps/web/postcss.config.mjs
apps/web/package.json
packages/content/package.json
packages/domain/package.json
packages/simulation/package.json
package.json
pnpm-workspace.yaml
pnpm-lock.yaml
tsconfig.packages.json
apps/web/tsconfig.json
packages/content/tsconfig.json
packages/domain/tsconfig.json
packages/simulation/tsconfig.json
```

Also recursively enumerate every regular file with extension `.ts`, `.tsx`, `.js`, `.mjs`, `.css`, or `.json` under `apps/web/src`, `packages/content/src`, `packages/domain/src`, and `packages/simulation/src`. Exclude only basenames matching `*.test.*`, `*.spec.*`, `*.d.ts`, `*.d.mts`, or `*.d.cts`, and the exact `apps/web/src/generated/prisma/` prefix. No fixture path is excluded in v1. Reject a symlink instead of silently following it. Include every canonical procedural module referenced by the compiled playable asset manifest under `packages/content/assets/` and its exact `apps/web/public/assets/` served copy. Do not include `.next` outputs, screenshots, documents, Git metadata, or absolute machine paths. Resolve and validate the actual local runtime import graph: any import escaping this membership is a failure. A new build configuration file or unsupported runtime-file extension requires a fingerprint-version amendment and renewed review. This deliberately includes unrelated source whose change might not alter pixels; conservative invalidation is acceptable for this local v1.

## Retrospective capture comparison

The historical fingerprint is `null`: no such digest existed when Nicolas replied. Record a reconstructed fingerprint with this method and preserve provenance for the files, reviewer capture, and fresh capture. File modification times alone do not prove what a running development server loaded. Reproduce exactly A/B x first/third person x ticks 360, 366, 371, 386 plus elevated pass tick 120 in Chrome at a 1280x720 CSS viewport. Preserve a separate byte hash for each original and fresh PNG. Record each capture's tick, pose, camera mode/settings, pass-view state, viewport, canvas rectangle and backing dimensions, DPR, browser identity, time when known, and source-file provenance. Mark reconstructed metadata explicitly. Require identical relevant capture settings and full canvas coverage by the comparison crop.

For this local v1 the current measured canvas rectangle is `x=91`, `y=109.1875`, `width=1098`, `height=458` CSS pixels. Compare decoded RGB pixels with no scaling, masks, blur, or tolerance inside the outward-rounded rectangle `(x=91, y=109, width=1098, height=459)`. All 17 pairs must have zero differing pixels and zero channel delta. A single missing pair, any PNG failing its own separately recorded byte hash, changed capture metadata, or nonidentical compared pixel fails the retrospective comparison. Paired whole-PNG byte equality is not required; bytes outside the crop and encoding may differ. The 17 preserved reviewer captures and fresh captures currently match exactly inside that rectangle, as independently checked. Normal-speed motion and the seven brief questions remain separate human-review gates.

A later renderer/input change needs new captures and review. A future reviewed catalog/start operation must derive a separate identity from an immutable emitted build and verify its served asset bytes and binding to this reviewed evidence. That running-build design and implementation require their own contract and independent review. A browser argument, hardcoded constant, or fresh filesystem hash beside a development build is never sufficient authority.

## Selected skinned-player candidate amendment

The local diagnostic membership now also includes every public resource in the fixed `PLAYER_RESOURCE_MANIFEST` from `apps/web/src/features/simulator/rigged-player/resources/manifest.ts`. Each entry's public URL maps to `apps/web/public` plus that URL; its exact byte length and SHA-256 must match before it is included. This binds the selected body, hair, animation, binary buffers and textures even though these resources are not yet canonical scenario assets. Source code and the manifest itself are already covered by recursive source membership. Reject missing, altered or unsafe resources. This conservative membership amendment invalidates all prior fingerprints and requires new captures; it cannot confer training/publication authority or reuse the historical procedural calibration.
