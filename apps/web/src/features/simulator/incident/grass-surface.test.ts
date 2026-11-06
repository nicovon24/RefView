import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { createGrassSurface } from './grass-surface';

const pixels = (texture: THREE.Texture) =>
  Array.from((texture as THREE.DataTexture).image.data as Uint8Array);

describe('grass surface', () => {
  it('generates the same stationary near and broad-scale detail on every creation', () => {
    const first = createGrassSurface();
    const second = createGrassSurface();
    expect(first.textures).toHaveLength(3);
    for (let index = 0; index < first.textures.length; index++) {
      expect(pixels(first.textures[index]!)).toEqual(pixels(second.textures[index]!));
    }
    const albedo = pixels(first.turf.map!);
    const samples = Array.from({ length: 256 }, (_, x) => albedo[(32 * 256 + x) * 4]!);
    expect(new Set(samples).size).toBeGreaterThan(8);
    expect(Math.max(...samples) - Math.min(...samples)).toBeLessThan(32);
    const normal = pixels(first.turf.normalMap!);
    const roughness = pixels(first.turf.roughnessMap!);
    expect(new Set(Array.from({ length: 256 }, (_, x) => normal[(32 * 256 + x) * 4]!)).size).toBeGreaterThan(2);
    expect(new Set(Array.from({ length: 256 }, (_, x) => roughness[(32 * 256 + x) * 4]!)).size).toBeGreaterThan(2);
    expect(Math.min(...Array.from({ length: 256 }, (_, x) => roughness[(32 * 256 + x) * 4]!))).toBeGreaterThan(200);
  });

  it('uses filtered repeating color, normal and roughness maps at one stripe scale', () => {
    const surface = createGrassSurface();
    const [albedo, normal, roughness] = surface.textures;
    for (const texture of surface.textures) {
      expect(texture.wrapS).toBe(THREE.RepeatWrapping);
      expect(texture.wrapT).toBe(THREE.RepeatWrapping);
      expect(texture.magFilter).toBe(THREE.LinearFilter);
      expect(texture.minFilter).toBe(THREE.LinearMipmapLinearFilter);
      expect(texture.generateMipmaps).toBe(true);
      expect(texture.anisotropy).toBeGreaterThanOrEqual(4);
      expect(texture.repeat.x).toBe(68 / 4);
      expect(texture.repeat.y).toBe(10.5 / 3.5);
    }
    expect(albedo.colorSpace).toBe(THREE.SRGBColorSpace);
    expect(normal.colorSpace).toBe(THREE.NoColorSpace);
    expect(roughness.colorSpace).toBe(THREE.NoColorSpace);
    for (const material of surface.materials) {
      expect(material.map).toBe(albedo);
      expect(material.normalMap).toBe(normal);
      expect(material.roughnessMap).toBe(roughness);
      expect(material.metalness).toBe(0);
      expect(material.roughness).toBeGreaterThan(0.9);
    }
  });

  it('uses gentle fixed mowing contrast and returns exactly the resources owned by the caller', () => {
    const surface = createGrassSurface();
    expect(surface.materials).toEqual([surface.turf, surface.stripeDark, surface.stripeLight]);
    expect(surface.turf.color.g).toBeGreaterThan(surface.turf.color.r);
    const dark = surface.stripeDark.color;
    const light = surface.stripeLight.color;
    expect(light.g).toBeGreaterThan(dark.g);
    expect(light.g - dark.g).toBeLessThan(0.12);
    expect(new Set(surface.materials).size).toBe(3);
    expect(new Set(surface.textures).size).toBe(3);
  });
});
