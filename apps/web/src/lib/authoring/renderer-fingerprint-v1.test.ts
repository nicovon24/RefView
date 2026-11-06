import { createHash } from 'node:crypto';
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';
import { createRendererFingerprintV1, validateRendererPathSetV1 } from './renderer-fingerprint-v1';

const root = fileURLToPath(new URL('../../../../../', import.meta.url));
const temporary: string[] = [];
const sha = (bytes: Uint8Array | string) => `sha256:${createHash('sha256').update(bytes).digest('hex')}`;

function fixture() {
  const original = createRendererFingerprintV1(root, '10.33.2');
  const copy = mkdtempSync(join(tmpdir(), 'refview-fingerprint-'));
  temporary.push(copy);
  for (const file of original.manifest.files) {
    const target = join(copy, ...file.path.split('/'));
    mkdirSync(dirname(target), { recursive: true });
    copyFileSync(join(root, ...file.path.split('/')), target);
  }
  return { copy, original };
}

afterEach(() => {
  for (const path of temporary.splice(0)) rmSync(path, { recursive: true, force: true });
});

describe('renderer fingerprint v1', () => {
  it('builds a stable, sorted exact manifest for the compiled authored incident', () => {
    const first = createRendererFingerprintV1(root, '10.33.2');
    const second = createRendererFingerprintV1(root, '10.33.2');
    expect(first).toEqual(second);
    const paths = first.manifest.files.map((file) => file.path);
    expect(paths).toEqual([...paths].sort());
    expect(new Set(paths.map((path) => path.toLowerCase())).size).toBe(paths.length);
    expect(paths).toContain('apps/web/public/assets/asset-001.mjs');
    expect(paths).toContain('packages/content/assets/asset-001.mjs');
    expect(paths).toContain('apps/web/src/lib/authoring/renderer-fingerprint-v1.ts');
    expect(paths).not.toContain('apps/web/src/lib/authoring/renderer-fingerprint-v1.test.ts');
    expect(first.manifest.execution).toEqual({ nodeVersion: process.version, pnpmVersion: '10.33.2',
      mode: 'development', sessionTestMode: false });
    expect(first.manifest.sourceContentHash).toMatch(/^sha256:[0-9a-f]{64}$/);
    expect(first.manifest.playableProjectionHash).toMatch(/^sha256:[0-9a-f]{64}$/);
    expect(first.fingerprint).toMatch(/^sha256:[0-9a-f]{64}$/);
    const file = first.manifest.files.find((entry) => entry.path === 'apps/web/next.config.ts')!;
    const bytes = readFileSync(join(root, file.path));
    expect(file).toEqual({ path: file.path, byteLength: bytes.byteLength, sha256: sha(bytes) });
  });

  it('changes digest for one byte or a newly enumerated source file', () => {
    const { copy, original } = fixture();
    const path = join(copy, 'apps/web/next.config.ts');
    writeFileSync(path, Buffer.concat([readFileSync(path), Buffer.from('x')]));
    expect(createRendererFingerprintV1(copy, '10.33.2').fingerprint).not.toBe(original.fingerprint);
    const extra = join(copy, 'apps/web/src/lib/authoring/new-render-input.ts');
    writeFileSync(extra, 'export const added = true;');
    expect(createRendererFingerprintV1(copy, '10.33.2').manifest.files.map((file) => file.path))
      .toContain('apps/web/src/lib/authoring/new-render-input.ts');
  });

  it('rejects a missing fixed file and mismatched served asset bytes', () => {
    const { copy } = fixture();
    unlinkSync(join(copy, 'apps/web/next.config.ts'));
    expect(() => createRendererFingerprintV1(copy, '10.33.2')).toThrow();
    copyFileSync(join(root, 'apps/web/next.config.ts'), join(copy, 'apps/web/next.config.ts'));
    const publicAsset = join(copy, 'apps/web/public/assets/asset-001.mjs');
    writeFileSync(publicAsset, Buffer.concat([readFileSync(publicAsset), Buffer.from('x')]));
    expect(() => createRendererFingerprintV1(copy, '10.33.2')).toThrow(/served asset byte mismatch/);
  });

  it('binds the selected skinned player resources and rejects changed texture bytes', () => {
    const { copy, original } = fixture();
    const paths = original.manifest.files.map((entry) => entry.path);
    const texture = 'apps/web/public/assets/player-audition/T_Superhero_Male_Dark.png';
    expect(paths).toContain(texture);
    expect(paths).toContain('apps/web/public/assets/player-audition/UAL1_Standard.glb');
    expect(paths).toContain('apps/web/public/assets/player-audition/hair/Hair_SimpleParted.gltf');
    const file = join(copy, texture);
    const changed = readFileSync(file);
    changed[changed.length - 1] = changed[changed.length - 1]! ^ 1;
    writeFileSync(file, changed);
    expect(() => createRendererFingerprintV1(copy, '10.33.2')).toThrow(/player resource|visual resource/);
  });

  it('rejects a local runtime import outside membership', () => {
    const { copy } = fixture();
    const page = join(copy, 'apps/web/src/app/[locale]/simulator/incident-preview/page.tsx');
    writeFileSync(page, `${readFileSync(page, 'utf8')}\nimport './missing-module';\n`);
    expect(() => createRendererFingerprintV1(copy, '10.33.2')).toThrow(/local import escapes/);
    writeFileSync(page, `${readFileSync(join(root, 'apps/web/src/app/[locale]/simulator/incident-preview/page.tsx'), 'utf8')}\nimport '/outside.js';\n`);
    expect(() => createRendererFingerprintV1(copy, '10.33.2')).toThrow(/absolute runtime import escapes/);
  });

  it('rejects a relative import that crosses above the repository root', () => {
    const { copy } = fixture();
    const page = join(copy, 'apps/web/src/app/[locale]/simulator/incident-preview/page.tsx');
    writeFileSync(page, `${readFileSync(page, 'utf8')}\nimport '../../../../../../../../packages/content/src/index';\n`);
    expect(() => createRendererFingerprintV1(copy, '10.33.2')).toThrow(/repository root/);
  });

  it('rejects CSS imports and URLs outside fingerprint membership', () => {
    const { copy } = fixture();
    const css = join(copy, 'apps/web/src/features/simulator/incident/incident.css');
    const original = readFileSync(css, 'utf8');
    writeFileSync(css, `${original}\n@import '../../../../../../outside.css';\n`);
    expect(() => createRendererFingerprintV1(copy, '10.33.2')).toThrow(/CSS|repository root|membership/);
    writeFileSync(css, `${original}\n.incident-page { background-image: url('/assets/extra.png'); }\n`);
    writeFileSync(join(copy, 'apps/web/public/assets/extra.png'), 'extra bytes');
    expect(() => createRendererFingerprintV1(copy, '10.33.2')).toThrow(/CSS|membership/);
    writeFileSync(css, `${original}\n@import 'https://example.invalid/remote.css';\n`);
    expect(() => createRendererFingerprintV1(copy, '10.33.2')).toThrow(/unsupported CSS import/);
  });

  it('rejects uppercase CSS dependency syntax outside fingerprint membership', () => {
    const { copy } = fixture();
    const css = join(copy, 'apps/web/src/features/simulator/incident/incident.css');
    const original = readFileSync(css, 'utf8');
    writeFileSync(css, `@IMPORT '../../../../../../outside.css';\n${original}`);
    expect(() => createRendererFingerprintV1(copy, '10.33.2')).toThrow(/CSS|membership|repository root/);
    writeFileSync(css, `${original}\n.incident-page { background-image: URL('/assets/extra.png'); }\n`);
    writeFileSync(join(copy, 'apps/web/public/assets/extra.png'), 'extra bytes');
    expect(() => createRendererFingerprintV1(copy, '10.33.2')).toThrow(/CSS|membership/);
  });

  it('rejects case duplicates and path escapes', () => {
    expect(() => validateRendererPathSetV1(['apps/web/a.ts', 'apps/web/A.ts']))
      .toThrow(/case-colliding/);
    expect(() => validateRendererPathSetV1(['apps/web/../a.ts'])).toThrow(/unsafe/);
    expect(() => validateRendererPathSetV1(['C:/outside.ts'])).toThrow(/unsafe/);
  });

  it('rejects a symlink in the enumerated source tree', () => {
    const { copy } = fixture();
    const link = join(copy, 'apps/web/src/lib/authoring/linked');
    symlinkSync(join(copy, 'apps/web/src/lib/authoring'), link, 'junction');
    expect(() => createRendererFingerprintV1(copy, '10.33.2')).toThrow(/symlink/);
  });
});
