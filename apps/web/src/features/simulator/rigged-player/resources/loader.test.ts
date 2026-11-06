import { readFile } from 'node:fs/promises';
import { createHash, webcrypto } from 'node:crypto';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import * as THREE from 'three';
import { PLAYER_RESOURCE_MANIFEST, PLAYER_RESOURCE_ROOT } from './manifest';
import { loadVerifiedPlayerResources, validatePlayerDocument } from './loader';

const parseAsync = vi.hoisted(() => vi.fn());
vi.mock('three/addons/loaders/GLTFLoader.js', () => ({ GLTFLoader: class {
  constructor(public manager: THREE.LoadingManager) { void manager; }
  parseAsync(data: string | ArrayBuffer, path: string) { return parseAsync(data, path, this.manager); }
} }));

const assetRoot = new URL('../../../../../public/assets/player-audition/', import.meta.url);

describe('rigged player resource manifest', () => {
  it('matches all 14 actual public asset bytes', async () => {
    expect(PLAYER_RESOURCE_MANIFEST).toHaveLength(14);
    for (const entry of PLAYER_RESOURCE_MANIFEST) {
      const bytes = await readFile(new URL(entry.path.slice(PLAYER_RESOURCE_ROOT.length), assetRoot));
      expect(bytes.byteLength, entry.path).toBe(entry.byteLength);
      expect(createHash('sha256').update(bytes).digest('hex'), entry.path).toBe(entry.sha256);
    }
  });

  it('rejects undeclared, remote, data and compressed dependencies', () => {
    expect(() => validatePlayerDocument('body', { asset: { version: '2.0' }, buffers: [{ uri: 'https://evil.test/x.bin' }] })).toThrow();
    expect(() => validatePlayerDocument('body', { asset: { version: '2.0' }, images: [{ uri: 'data:image/png;base64,AAAA' }] })).toThrow();
    expect(() => validatePlayerDocument('body', { asset: { version: '2.0' }, buffers: [{ uri: '../hair/Hair_SimpleParted.bin' }] })).toThrow();
    expect(() => validatePlayerDocument('body', { asset: { version: '2.0' }, extensionsUsed: ['KHR_draco_mesh_compression'] })).toThrow();
  });

  it('accepts the exact dependencies declared by both existing glTF documents', async () => {
    const body = JSON.parse(await readFile(new URL('Superhero_Male_FullBody.gltf', assetRoot), 'utf8'));
    const hair = JSON.parse(await readFile(new URL('hair/Hair_SimpleParted.gltf', assetRoot), 'utf8'));
    expect(() => validatePlayerDocument('body', body)).not.toThrow();
    expect(() => validatePlayerDocument('hair', hair)).not.toThrow();
  });
});

describe('verified loader', () => {
  const originalFetch = globalThis.fetch;
  beforeEach(() => {
    parseAsync.mockReset();
    const scene = new THREE.Group();
    parseAsync.mockImplementation(async (_data: unknown, path: string) => ({
      scene, scenes: [scene], animations: [new THREE.AnimationClip('Jog_Fwd_Loop', 1, [])],
      parser: { getDependencies: async () => Array.from({ length: path.endsWith('hair/') ? 2 : 7 }, () => new THREE.Texture()) },
    }));
    globalThis.fetch = vi.fn(async (url: RequestInfo | URL) => {
      const path = String(url).replace(PLAYER_RESOURCE_ROOT, '');
      const bytes = await readFile(new URL(path, assetRoot));
      return new Response(bytes, { status: 200 });
    });
    vi.stubGlobal('crypto', webcrypto);
  });
  afterEach(() => { globalThis.fetch = originalFetch; vi.unstubAllGlobals(); });

  it('fetches the verified closure once, parses three documents, and disposes idempotently', async () => {
    const result = await loadVerifiedPlayerResources();
    expect(globalThis.fetch).toHaveBeenCalledTimes(14);
    expect(parseAsync).toHaveBeenCalledTimes(3);
    expect(result.bodyScene).toBeInstanceOf(THREE.Group);
    expect(result.hairScene).toBeInstanceOf(THREE.Group);
    expect(result.resourceDigest).toMatch(/^[a-f0-9]{64}$/);
    expect(parseAsync.mock.calls[0][2].resolveURL(`${PLAYER_RESOURCE_ROOT}Superhero_Male_FullBody.bin`)).toMatch(/^blob:/);
    expect(() => parseAsync.mock.calls[0][2].resolveURL('https://evil.test/x.bin')).toThrow(/Undeclared/);
    result.dispose();
    result.dispose();
  });

  it('rejects a tampered byte and allows a fresh retry', async () => {
    const fetchReal = globalThis.fetch;
    globalThis.fetch = vi.fn(async (url: RequestInfo | URL, init?: RequestInit) => {
      if (String(url).endsWith('T_Eye_Brown.png')) return new Response(new Uint8Array([1]), { status: 200 });
      return fetchReal(url, init);
    });
    await expect(loadVerifiedPlayerResources()).rejects.toThrow(/T_Eye_Brown.png/);
    expect(parseAsync).not.toHaveBeenCalled();
    globalThis.fetch = fetchReal;
    await expect(loadVerifiedPlayerResources()).resolves.toHaveProperty('bodyScene');
  });

  it('releases decoded resources after a later parse failure, then retries', async () => {
    const geometry = new THREE.BufferGeometry();
    const material = new THREE.MeshStandardMaterial();
    const disposeGeometry = vi.spyOn(geometry, 'dispose');
    const disposeMaterial = vi.spyOn(material, 'dispose');
    const scene = new THREE.Group();
    scene.add(new THREE.Mesh(geometry, material));
    parseAsync.mockResolvedValueOnce({ scene, scenes: [scene], animations: [], parser: { getDependencies: async () => Array.from({ length: 7 }, () => new THREE.Texture()) } });
    parseAsync.mockRejectedValueOnce(new Error('bad hair'));
    await expect(loadVerifiedPlayerResources()).rejects.toThrow('bad hair');
    expect(disposeGeometry).toHaveBeenCalledOnce();
    expect(disposeMaterial).toHaveBeenCalledOnce();
    await expect(loadVerifiedPlayerResources()).resolves.toHaveProperty('hairScene');
  });

  it('aborts before fetch when the caller signal is already aborted', async () => {
    const controller = new AbortController();
    controller.abort();
    await expect(loadVerifiedPlayerResources({ signal: controller.signal })).rejects.toMatchObject({ name: 'AbortError' });
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });
});
