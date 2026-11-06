import * as THREE from 'three';
import { GLTFLoader, type GLTF } from 'three/addons/loaders/GLTFLoader.js';
import { PLAYER_RESOURCE_FILES, PLAYER_RESOURCE_ROOT, PLAYER_RESOURCE_VERSION, type PlayerResourcePath } from './manifest';

type DocumentKind = 'body' | 'hair' | 'animation';
type GltfDocument = {
  asset?: { version?: string };
  extensionsUsed?: string[];
  extensionsRequired?: string[];
  buffers?: { uri?: string }[];
  images?: { uri?: string; bufferView?: number }[];
};

const documentPaths: Record<DocumentKind, PlayerResourcePath> = {
  body: 'Superhero_Male_FullBody.gltf',
  hair: 'hair/Hair_SimpleParted.gltf',
  animation: 'UAL1_Standard.glb',
};

const dependencies: Record<DocumentKind, readonly PlayerResourcePath[]> = {
  body: [
    'Superhero_Male_FullBody.bin', 'T_Hair_1_Normal_png.png', 'T_Hair_1_BaseColor.png',
    'T_Eye_Normal_png.png', 'T_Eye_Brown.png', 'T_Superhero_Male_Normal.png',
    'T_Superhero_Male_Dark.png', 'T_Superhero_Male_Roughness.png',
  ],
  hair: ['hair/Hair_SimpleParted.bin', 'hair/T_Hair_1_Normal.png', 'hair/T_Hair_1_BaseColor.png'],
  animation: [],
};

function localDependency(kind: DocumentKind, uri: string): PlayerResourcePath {
  if (!/^[A-Za-z0-9_.-]+$/.test(uri) || uri === '.' || uri === '..') {
    throw new Error(`Unsupported ${kind} resource URI: ${uri}`);
  }
  const folder = kind === 'hair' ? 'hair/' : '';
  const path = `${folder}${uri}` as PlayerResourcePath;
  if (!dependencies[kind].includes(path)) throw new Error(`Undeclared ${kind} resource: ${uri}`);
  return path;
}

export function validatePlayerDocument(kind: DocumentKind, document: GltfDocument): void {
  if (document.asset?.version !== '2.0') throw new Error(`Unsupported ${kind} glTF version`);
  if ((document.extensionsUsed?.length ?? 0) > 0 || (document.extensionsRequired?.length ?? 0) > 0) {
    throw new Error(`Unsupported ${kind} glTF extension or decoder`);
  }
  const referenced = new Set<PlayerResourcePath>();
  for (const buffer of document.buffers ?? []) {
    if (buffer.uri === undefined) {
      if (kind !== 'animation') throw new Error(`Missing ${kind} buffer URI`);
      continue;
    }
    referenced.add(localDependency(kind, buffer.uri));
  }
  for (const image of document.images ?? []) {
    if (image.uri === undefined) throw new Error(`Unsupported embedded ${kind} image`);
    if (image.bufferView !== undefined) throw new Error(`Unsupported ${kind} image bufferView`);
    referenced.add(localDependency(kind, image.uri));
  }
  if (referenced.size !== dependencies[kind].length || dependencies[kind].some((path) => !referenced.has(path))) {
    throw new Error(`Incomplete ${kind} resource closure`);
  }
}

function decodeDocument(kind: DocumentKind, bytes: ArrayBuffer): GltfDocument {
  if (kind !== 'animation') return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)) as GltfDocument;
  const view = new DataView(bytes);
  if (bytes.byteLength < 20 || view.getUint32(0, true) !== 0x46546c67 || view.getUint32(4, true) !== 2 || view.getUint32(8, true) !== bytes.byteLength) {
    throw new Error('Invalid animation GLB header');
  }
  const jsonLength = view.getUint32(12, true);
  if (view.getUint32(16, true) !== 0x4e4f534a || 20 + jsonLength > bytes.byteLength) throw new Error('Invalid animation GLB JSON chunk');
  return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(new Uint8Array(bytes, 20, jsonLength))) as GltfDocument;
}

async function sha256(bytes: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function disposeScenes(gltfs: readonly GLTF[]): void {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const textures = new Set<THREE.Texture>();
  for (const gltf of gltfs) {
    for (const scene of gltf.scenes) {
      scene.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) return;
        geometries.add(object.geometry);
        for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
          if (!material) continue;
          materials.add(material);
          for (const value of Object.values(material)) if (value instanceof THREE.Texture) textures.add(value);
        }
      });
    }
  }
  for (const geometry of geometries) geometry.dispose();
  for (const material of materials) material.dispose();
  for (const texture of textures) {
    const image: unknown = texture.image;
    if (image && typeof image === 'object' && 'close' in image && typeof image.close === 'function') image.close();
    texture.dispose();
  }
}

async function requireDecodedTextures(gltf: GLTF, expected: number): Promise<void> {
  const textures: unknown[] = await gltf.parser.getDependencies('texture');
  if (textures.length !== expected || textures.some((texture) => !(texture instanceof THREE.Texture))) {
    throw new Error('Player texture decoding failed');
  }
}

export type VerifiedPlayerResources = {
  bodyScene: THREE.Group;
  hairScene: THREE.Group;
  clips: readonly THREE.AnimationClip[];
  resourceDigest: string;
  dispose(): void;
};

export async function loadVerifiedPlayerResources({ signal }: { signal?: AbortSignal } = {}): Promise<VerifiedPlayerResources> {
  signal?.throwIfAborted();
  const controller = new AbortController();
  const onAbort = () => controller.abort(signal?.reason);
  signal?.addEventListener('abort', onAbort, { once: true });
  const blobs: string[] = [];
  const decoded: GLTF[] = [];
  let transferred = false;
  try {
    const verified = new Map<PlayerResourcePath, ArrayBuffer>();
    await Promise.all(PLAYER_RESOURCE_FILES.map(async (entry) => {
      const response = await fetch(`${PLAYER_RESOURCE_ROOT}${entry.path}`, { signal: controller.signal });
      if (!response.ok) throw new Error(`Player resource unavailable: ${entry.path} (${response.status})`);
      const bytes = await response.arrayBuffer();
      if (bytes.byteLength !== entry.bytes || await sha256(bytes) !== entry.sha256) {
        throw new Error(`Player resource integrity mismatch: ${entry.path}`);
      }
      verified.set(entry.path, bytes);
    })).catch((error: unknown) => { controller.abort(); throw error; });
    signal?.throwIfAborted();
    for (const kind of ['body', 'hair', 'animation'] as const) {
      validatePlayerDocument(kind, decodeDocument(kind, verified.get(documentPaths[kind])!));
    }

    const urls = new Map<string, string>();
    for (const entry of PLAYER_RESOURCE_FILES) {
      if (Object.values(documentPaths).includes(entry.path)) continue;
      const type = entry.path.endsWith('.png') ? 'image/png' : 'application/octet-stream';
      const url = URL.createObjectURL(new Blob([verified.get(entry.path)!], { type }));
      blobs.push(url);
      urls.set(`${PLAYER_RESOURCE_ROOT}${entry.path}`, url);
    }
    const manager = new THREE.LoadingManager();
    manager.setURLModifier((requested) => {
      const mapped = urls.get(requested);
      if (!mapped) throw new Error(`Undeclared player loader URL: ${requested}`);
      return mapped;
    });
    const loader = new GLTFLoader(manager);
    const body = await loader.parseAsync(new TextDecoder().decode(verified.get(documentPaths.body)), PLAYER_RESOURCE_ROOT);
    decoded.push(body);
    await requireDecodedTextures(body, 7);
    signal?.throwIfAborted();
    const hair = await loader.parseAsync(new TextDecoder().decode(verified.get(documentPaths.hair)), `${PLAYER_RESOURCE_ROOT}hair/`);
    decoded.push(hair);
    await requireDecodedTextures(hair, 2);
    signal?.throwIfAborted();
    const animation = await loader.parseAsync(verified.get(documentPaths.animation)!, PLAYER_RESOURCE_ROOT);
    decoded.push(animation);
    signal?.throwIfAborted();
    if (!(body.scene instanceof THREE.Group) || !(hair.scene instanceof THREE.Group) || animation.animations.length === 0) {
      throw new Error('Player resource scenes or animation clips missing');
    }
    const manifestIdentity = `${PLAYER_RESOURCE_VERSION}\n${PLAYER_RESOURCE_FILES.map((entry) => `${PLAYER_RESOURCE_ROOT}${entry.path}\t${entry.bytes}\t${entry.sha256}`).sort().join('\n')}`;
    const resourceDigest = await sha256(new TextEncoder().encode(manifestIdentity).buffer);
    signal?.throwIfAborted();
    let disposed = false;
    transferred = true;
    return {
      bodyScene: body.scene,
      hairScene: hair.scene,
      clips: Object.freeze([...animation.animations]),
      resourceDigest,
      dispose() {
        if (disposed) return;
        disposed = true;
        disposeScenes(decoded);
      },
    };
  } finally {
    for (const url of blobs) URL.revokeObjectURL(url);
    if (!transferred) disposeScenes(decoded);
    signal?.removeEventListener('abort', onAbort);
  }
}
