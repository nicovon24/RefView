import * as THREE from 'three';

const SIZE = 256;
const CHANNELS = 4;
const TILE_PIXELS = SIZE * SIZE;

function hash(x: number, y: number, seed: number): number {
  let value = Math.imul(x + seed, 0x45d9f3b) ^ Math.imul(y + seed, 0x119de1f3);
  value = Math.imul(value ^ (value >>> 16), 0x45d9f3b);
  return ((value ^ (value >>> 16)) >>> 0) / 0xffffffff;
}

function periodicNoise(x: number, y: number, period: number, seed: number): number {
  const cells = SIZE / period;
  const cellX = Math.floor(x / period);
  const cellY = Math.floor(y / period);
  const localX = x / period - cellX;
  const localY = y / period - cellY;
  const blendX = localX * localX * (3 - 2 * localX);
  const blendY = localY * localY * (3 - 2 * localY);
  const sample = (offsetX: number, offsetY: number) =>
    hash((cellX + offsetX) % cells, (cellY + offsetY) % cells, seed);
  const top = sample(0, 0) * (1 - blendX) + sample(1, 0) * blendX;
  const bottom = sample(0, 1) * (1 - blendX) + sample(1, 1) * blendX;
  return top * (1 - blendY) + bottom * blendY;
}

function texture(data: Uint8Array, colorSpace: THREE.ColorSpace): THREE.DataTexture {
  const result = new THREE.DataTexture(data, SIZE, SIZE, THREE.RGBAFormat);
  result.colorSpace = colorSpace;
  result.wrapS = THREE.RepeatWrapping;
  result.wrapT = THREE.RepeatWrapping;
  result.magFilter = THREE.LinearFilter;
  result.minFilter = THREE.LinearMipmapLinearFilter;
  result.generateMipmaps = true;
  result.anisotropy = 8;
  result.repeat.set(68 / 4, 10.5 / 3.5);
  result.needsUpdate = true;
  return result;
}

/** Creates original, stationary turf maps. The caller owns every returned GPU resource. */
export function createGrassSurface(): {
  turf: THREE.MeshStandardMaterial;
  stripeDark: THREE.MeshStandardMaterial;
  stripeLight: THREE.MeshStandardMaterial;
  textures: readonly THREE.Texture[];
  materials: readonly THREE.MeshStandardMaterial[];
} {
  const albedoData = new Uint8Array(TILE_PIXELS * CHANNELS);
  const normalData = new Uint8Array(TILE_PIXELS * CHANNELS);
  const roughnessData = new Uint8Array(TILE_PIXELS * CHANNELS);
  const heights = new Float32Array(TILE_PIXELS);

  for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
    const index = y * SIZE + x;
    const pixel = index * CHANNELS;
    const broad = periodicNoise(x, y, 64, 73) - 0.5;
    const middle = periodicNoise(x, y, 16, 193) - 0.5;
    const fine = periodicNoise(x, y, 4, 317) - 0.5;
    const fleck = hash(x, y, 431) - 0.5;
    const shade = 240 + broad * 13 + middle * 8 + fine * 5 + fleck * 3;
    albedoData[pixel] = Math.round(shade);
    albedoData[pixel + 1] = Math.round(shade + 3);
    albedoData[pixel + 2] = Math.round(shade - 5);
    albedoData[pixel + 3] = 255;
    heights[index] = middle * 0.3 + fine;
    const roughness = Math.round(222 + broad * 9 + middle * 7 + fine * 3);
    roughnessData[pixel] = roughness;
    roughnessData[pixel + 1] = roughness;
    roughnessData[pixel + 2] = roughness;
    roughnessData[pixel + 3] = 255;
  }

  for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
    const pixel = (y * SIZE + x) * CHANNELS;
    const horizontal = heights[y * SIZE + ((x + 1) % SIZE)]! - heights[y * SIZE + ((x + SIZE - 1) % SIZE)]!;
    const vertical = heights[((y + 1) % SIZE) * SIZE + x]! - heights[((y + SIZE - 1) % SIZE) * SIZE + x]!;
    const nx = -horizontal * 0.16;
    const ny = -vertical * 0.16;
    const inverseLength = 1 / Math.hypot(nx, ny, 1);
    normalData[pixel] = Math.round((nx * inverseLength * 0.5 + 0.5) * 255);
    normalData[pixel + 1] = Math.round((ny * inverseLength * 0.5 + 0.5) * 255);
    normalData[pixel + 2] = Math.round((inverseLength * 0.5 + 0.5) * 255);
    normalData[pixel + 3] = 255;
  }

  const albedo = texture(albedoData, THREE.SRGBColorSpace);
  const normal = texture(normalData, THREE.NoColorSpace);
  const roughness = texture(roughnessData, THREE.NoColorSpace);
  const makeMaterial = (color: string) => new THREE.MeshStandardMaterial({
    color,
    map: albedo,
    normalMap: normal,
    normalScale: new THREE.Vector2(0.35, 0.35),
    roughnessMap: roughness,
    roughness: 0.96,
    metalness: 0,
  });
  const turf = makeMaterial('#599758');
  const stripeDark = makeMaterial('#559052');
  const stripeLight = makeMaterial('#5c995a');
  return {
    turf,
    stripeDark,
    stripeLight,
    textures: [albedo, normal, roughness],
    materials: [turf, stripeDark, stripeLight],
  };
}
