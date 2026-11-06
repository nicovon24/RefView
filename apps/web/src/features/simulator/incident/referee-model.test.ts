import { describe, expect, it, vi } from 'vitest';
import * as THREE from 'three';
import { createRefereeModel, disposeRefereeModel } from './referee-model';

describe('shared referee presentation', () => {
  it('builds an articulated silhouette with transparent third-person materials', () => {
    const root = createRefereeModel();
    expect(root).toBeInstanceOf(THREE.Group);
    for (const name of ['torso', 'head', 'leftSleeve', 'rightSleeve', 'leftLeg', 'rightLeg'])
      expect(root.getObjectByName(name)).toBeInstanceOf(THREE.Mesh);
    let count = 0;
    root.traverse((node) => {
      if (!(node instanceof THREE.Mesh)) return;
      count++;
      const material = node.material as THREE.MeshStandardMaterial;
      expect(material.transparent).toBe(true);
      expect(material.opacity).toBe(0.25);
      expect(material.depthWrite).toBe(false);
    });
    expect(count).toBeGreaterThan(10);
    disposeRefereeModel(root);
  });

  it('owns and disposes its distinct geometries and shared materials once', () => {
    const root = createRefereeModel();
    const geometries = new Set<THREE.BufferGeometry>();
    const materials = new Set<THREE.Material>();
    root.traverse((node) => {
      if (!(node instanceof THREE.Mesh)) return;
      geometries.add(node.geometry);
      materials.add(node.material as THREE.Material);
    });
    const spies = [...geometries, ...materials].map((resource) => vi.spyOn(resource, 'dispose'));
    disposeRefereeModel(root);
    for (const spy of spies) expect(spy).toHaveBeenCalledOnce();
  });

  it('reconstructs the same presentation for either route', () => {
    const authoring = createRefereeModel();
    const playtest = createRefereeModel();
    const signature = (root: THREE.Group) => {
      const parts: unknown[] = [];
      root.traverse((node) => {
        if (!(node instanceof THREE.Mesh)) return;
        const material = node.material as THREE.MeshStandardMaterial;
        parts.push([node.name, node.position.toArray(), node.rotation.toArray(),
          node.scale.toArray(), material.color.getHexString(),
          node.geometry.getAttribute('position').count]);
      });
      return parts;
    };
    expect(signature(authoring)).toEqual(signature(playtest));
    disposeRefereeModel(authoring);
    disposeRefereeModel(playtest);
  });
});
