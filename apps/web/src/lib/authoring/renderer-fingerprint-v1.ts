import { createHash } from 'node:crypto';
import { lstatSync, readFileSync, readdirSync } from 'node:fs';
import { isAbsolute, join, relative, resolve } from 'node:path';
import ts from 'typescript';
import { compileCanonicalScenarioSourceV2 } from '@refview/content';
import { createIncident001GeometryResolverV2, createIncident001SourceV2 } from '../../../../../packages/content/src/authored-incident-v2';
import { canonicalJsonV2 } from '../../../../../packages/content/src/source-core-v2';
import { PLAYER_RESOURCE_MANIFEST } from '../../features/simulator/rigged-player/resources/manifest';

type FileEntry = Readonly<{ path: string; byteLength: number; sha256: string }>;
type Manifest = Readonly<{
  schemaVersion: 1;
  sourceContentHash: string;
  playableProjectionHash: string;
  execution: Readonly<{ nodeVersion: string; pnpmVersion: string; mode: 'development'; sessionTestMode: false }>;
  files: readonly FileEntry[];
}>;

const FIXED = [
  'apps/web/src/features/simulator/incident/IncidentPreview.tsx',
  'apps/web/src/features/simulator/incident/incident.css',
  'apps/web/src/features/simulator/incident/load-incident.ts',
  'apps/web/src/features/simulator/controls/controls.ts',
  'apps/web/src/app/[locale]/simulator/incident-preview/page.tsx',
  'apps/web/src/app/[locale]/layout.tsx',
  'apps/web/src/app/globals.css',
  'apps/web/src/lib/i18n/locale.ts',
  'apps/web/next.config.ts', 'apps/web/postcss.config.mjs', 'apps/web/package.json',
  'packages/content/package.json', 'packages/domain/package.json', 'packages/simulation/package.json',
  'package.json', 'pnpm-workspace.yaml', 'pnpm-lock.yaml', 'tsconfig.packages.json',
  'apps/web/tsconfig.json', 'packages/content/tsconfig.json', 'packages/domain/tsconfig.json',
  'packages/simulation/tsconfig.json',
] as const;
const ROOTS = ['apps/web/src', 'packages/content/src', 'packages/domain/src', 'packages/simulation/src'] as const;
const EXT = /\.(?:ts|tsx|js|mjs|css|json)$/;
const EXCLUDED = /(?:\.test\.|\.spec\.|\.d\.(?:ts|mts|cts)$)/;
const compare = (a: string, b: string) => a < b ? -1 : a > b ? 1 : 0;
const digest = (bytes: Uint8Array | string) => `sha256:${createHash('sha256').update(bytes).digest('hex')}`;

function checkedPath(path: string): void {
  if (!path || path.includes('\\') || path.startsWith('/') || /^[A-Za-z]:/.test(path) ||
    path.split('/').some((segment) => segment === '' || segment === '.' || segment === '..')) {
    throw new Error(`unsafe manifest path: ${path}`);
  }
}

export function validateRendererPathSetV1(paths: readonly string[]): void {
  const folded = new Set<string>();
  for (const path of paths) {
    checkedPath(path);
    const lower = path.toLowerCase();
    if (folded.has(lower)) throw new Error(`case-colliding manifest path: ${path}`);
    folded.add(lower);
  }
}

function readChecked(root: string, path: string): Buffer {
  checkedPath(path);
  let current = root;
  const rootReal = resolve(root);
  for (const segment of path.split('/')) {
    current = join(current, segment);
    const stat = lstatSync(current);
    if (stat.isSymbolicLink()) throw new Error(`symlink in manifest path: ${path}`);
  }
  if (relative(rootReal, resolve(current)).startsWith('..')) throw new Error(`path escape: ${path}`);
  if (!lstatSync(current).isFile()) throw new Error(`not a regular file: ${path}`);
  return readFileSync(current);
}

function enumerate(root: string, base: string, output: Set<string>): void {
  const dir = resolve(root, ...base.split('/'));
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = `${base}/${entry.name}`;
    if (path.startsWith('apps/web/src/generated/prisma/')) continue;
    if (entry.isSymbolicLink()) throw new Error(`symlink in source tree: ${path}`);
    if (entry.isDirectory()) enumerate(root, path, output);
    else if (entry.isFile() && EXT.test(entry.name) && !EXCLUDED.test(entry.name)) output.add(path);
  }
}

function resolveLocalImport(from: string, specifier: string, membership: Set<string>): string | undefined {
  if (specifier.startsWith('/') || /^[A-Za-z]:/.test(specifier) || specifier.startsWith('file:')) {
    throw new Error(`absolute runtime import escapes fingerprint membership: ${from} -> ${specifier}`);
  }
  let base: string;
  if (specifier.startsWith('.')) {
    base = `${from.slice(0, from.lastIndexOf('/'))}/${specifier}`;
  } else if (specifier.startsWith('@/')) {
    base = `apps/web/src/${specifier.slice(2)}`;
  } else {
    const match = /^@refview\/(content|domain|simulation)(?:\/(.*))?$/.exec(specifier);
    if (!match) return undefined;
    base = `packages/${match[1]}/src/${match[2] || 'index'}`;
  }
  const parts: string[] = [];
  for (const part of base.split('/')) {
    if (part === '..') {
      if (parts.length === 0) throw new Error(`relative import crosses repository root: ${from} -> ${specifier}`);
      parts.pop();
    } else if (part !== '.') parts.push(part);
  }
  const normalized = parts.join('/');
  for (const candidate of [normalized, ...['.ts', '.tsx', '.js', '.mjs', '.css', '.json', '/index.ts', '/index.tsx'].map((suffix) => normalized + suffix)]) {
    if (membership.has(candidate)) return candidate;
  }
  throw new Error(`local import escapes fingerprint membership: ${from} -> ${specifier}`);
}

function verifyCssDependencies(path: string, source: string, membership: Set<string>, pending: string[]): void {
  const imports = [...source.matchAll(/@import\s+(?:url\(\s*)?(?:"([^"]+)"|'([^']+)'|([^\s);]+))/gi)];
  if ([...source.matchAll(/@import\b/gi)].length !== imports.length) {
    throw new Error(`unsupported CSS import syntax: ${path}`);
  }
  for (const match of imports) {
    const specifier = match[1] ?? match[2] ?? match[3]!;
    if (specifier.includes('?') || specifier.includes('#') ||
      /^(?:[a-z]+:|\/\/)/i.test(specifier)) throw new Error(`unsupported CSS import: ${path} -> ${specifier}`);
    const target = resolveLocalImport(path, specifier, membership);
    if (target) {
      if (!target.endsWith('.css')) throw new Error(`unsupported CSS import target: ${path} -> ${specifier}`);
      pending.push(target);
    }
  }
  const urls = [...source.matchAll(/url\(\s*(?:"([^"]*)"|'([^']*)'|([^\s)]*))\s*\)/gi)];
  if ([...source.matchAll(/url\s*\(/gi)].length !== urls.length) {
    throw new Error(`unsupported CSS url syntax: ${path}`);
  }
  for (const match of urls) {
    if (imports.some((item) => item.index <= match.index &&
      match.index < item.index + item[0].length)) continue;
    const specifier = match[1] ?? match[2] ?? match[3]!;
    if (specifier.startsWith('data:') || specifier.startsWith('#')) continue;
    if (specifier.includes('?') || specifier.includes('#') || /^(?:https?:|\/\/)/.test(specifier)) {
      throw new Error(`unsupported CSS url: ${path} -> ${specifier}`);
    }
    const target = specifier.startsWith('/assets/')
      ? `apps/web/public${specifier}`
      : resolveLocalImport(path, specifier, membership);
    if (!target || !membership.has(target)) throw new Error(`CSS url escapes fingerprint membership: ${path} -> ${specifier}`);
  }
}

function verifyPreviewImportClosure(root: string, membership: Set<string>): void {
  const pending = ['apps/web/src/app/[locale]/simulator/incident-preview/page.tsx',
    'apps/web/src/app/[locale]/layout.tsx'];
  const seen = new Set<string>();
  while (pending.length) {
    const path = pending.pop()!;
    if (seen.has(path)) continue;
    seen.add(path);
    const source = readChecked(root, path).toString('utf8');
    if (path.endsWith('.css')) {
      verifyCssDependencies(path, source, membership, pending);
      continue;
    }
    const ast = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true,
      path.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
    const visit = (node: ts.Node): void => {
      let specifier: string | undefined;
      if (ts.isImportDeclaration(node) && !node.importClause?.isTypeOnly && ts.isStringLiteral(node.moduleSpecifier)) {
        specifier = node.moduleSpecifier.text;
      } else if (ts.isExportDeclaration(node) && !node.isTypeOnly && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
        specifier = node.moduleSpecifier.text;
      } else if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword) {
        const argument = node.arguments[0];
        if (argument && ts.isStringLiteral(argument)) specifier = argument.text;
        else if (path === 'apps/web/src/features/simulator/incident/IncidentPreview.tsx' &&
          source.slice(node.getStart(ast), node.getEnd()).includes('webpackIgnore: true') &&
          argument && ts.isIdentifier(argument) && argument.text === 'objectUrl') return;
        else throw new Error(`nonliteral dynamic import: ${path}`);
      } else if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) &&
        node.expression.text === 'require' && node.arguments.length === 1) {
        const argument = node.arguments[0];
        if (!argument || !ts.isStringLiteral(argument)) throw new Error(`nonliteral require: ${path}`);
        specifier = argument.text;
      }
      if (specifier) {
        const target = resolveLocalImport(path, specifier, membership);
        if (target && /\.(?:ts|tsx|js|mjs|css)$/.test(target)) pending.push(target);
      }
      ts.forEachChild(node, visit);
    };
    visit(ast);
  }
}

/** Diagnostic identity for local retrospective review; never a publication or start credential. */
export function createRendererFingerprintV1(repositoryRoot: string, pnpmVersion: string) {
  if (!isAbsolute(repositoryRoot) || !/^\d+\.\d+\.\d+$/.test(pnpmVersion)) {
    throw new TypeError('absolute repository root and pnpm version are required');
  }
  const root = resolve(repositoryRoot);
  const membership = new Set<string>(FIXED);
  for (const sourceRoot of ROOTS) enumerate(root, sourceRoot, membership);
  for (const resource of PLAYER_RESOURCE_MANIFEST) {
    if (!resource.path.startsWith('/assets/player-audition/')) throw new Error('unsafe player resource path');
    const path = `apps/web/public${resource.path}`;
    const bytes = readChecked(root, path);
    if (bytes.byteLength !== resource.byteLength || digest(bytes) !== `sha256:${resource.sha256}`) {
      throw new Error(`player resource byte mismatch: ${resource.path}`);
    }
    membership.add(path);
  }
  const source = createIncident001SourceV2();
  const expected = new Map(source.rendering.assets.map((asset) => [asset.assetId, asset.neutralClientPath]));
  const compiled = compileCanonicalScenarioSourceV2(source, {
    ...createIncident001GeometryResolverV2(),
    resolveAssetBytes: (assetId, neutralClientPath) => {
      if (expected.get(assetId) !== neutralClientPath || !/^\/assets\/asset-[0-9]{3,}\.mjs$/.test(neutralClientPath)) return undefined;
      const name = neutralClientPath.slice('/assets/'.length);
      const canonicalPath = `packages/content/assets/${name}`;
      const publicPath = `apps/web/public/assets/${name}`;
      const canonical = readChecked(root, canonicalPath);
      const served = readChecked(root, publicPath);
      if (!canonical.equals(served)) throw new Error(`served asset byte mismatch: ${name}`);
      membership.add(canonicalPath);
      membership.add(publicPath);
      return canonical;
    },
  });
  for (const asset of compiled.playable.assetManifest) {
    if (!asset.neutralClientPath.startsWith('/assets/')) throw new Error('unsafe playable asset path');
    const name = asset.neutralClientPath.slice('/assets/'.length);
    if (!membership.has(`packages/content/assets/${name}`) || !membership.has(`apps/web/public/assets/${name}`)) {
      throw new Error(`playable asset missing from fingerprint: ${name}`);
    }
  }
  verifyPreviewImportClosure(root, membership);
  const paths = [...membership].sort(compare);
  validateRendererPathSetV1(paths);
  const files = paths.map((path): FileEntry => {
    const bytes = readChecked(root, path);
    return { path, byteLength: bytes.byteLength, sha256: digest(bytes) };
  });
  const manifest: Manifest = {
    schemaVersion: 1,
    sourceContentHash: compiled.contentHash,
    playableProjectionHash: digest(canonicalJsonV2(['refview-playable-v1', compiled.playable])),
    execution: { nodeVersion: process.version, pnpmVersion, mode: 'development', sessionTestMode: false },
    files,
  };
  return { manifest, fingerprint: digest(canonicalJsonV2(['refview-renderer-input-v1', manifest])) };
}

