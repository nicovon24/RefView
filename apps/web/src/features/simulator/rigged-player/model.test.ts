import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as THREE from 'three';
import { createRiggedPlayer } from './model';

function fixture() {
  const bodyScene = new THREE.Group();
  const rootBone = new THREE.Bone();
  rootBone.name = 'Hips';
  const head = new THREE.Bone();
  head.name = 'Head';
  rootBone.add(head);
  bodyScene.add(rootBone);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, 0.1, 1.2, 0, 0.1, 1.7, 0], 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute([0, 0, 1, 0, 0, 1, 0, 0, 1], 3));
  geometry.setAttribute('skinIndex', new THREE.Uint16BufferAttribute([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], 4));
  geometry.setAttribute('skinWeight', new THREE.Float32BufferAttribute([1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0], 4));
  geometry.setIndex([0, 1, 2]);
  const material = new THREE.MeshStandardMaterial();
  const body = new THREE.SkinnedMesh(geometry, material);
  body.name = 'Body';
  body.add(rootBone);
  body.bind(new THREE.Skeleton([rootBone, head]));
  bodyScene.add(body);
  const hairScene = new THREE.Group();
  const hairGeometry = new THREE.BoxGeometry(0.2, 0.1, 0.2);
  const hairMaterial = new THREE.MeshStandardMaterial();
  hairScene.add(new THREE.Mesh(hairGeometry, hairMaterial));
  return { bodyScene, hairScene, geometry, material, hairGeometry, hairMaterial };
}

beforeEach(() => {
  vi.stubGlobal('document', { createElement: () => ({ width: 0, height: 0, getContext: () => null }) });
});

describe('rigged player factory', () => {
  it('narrows only the athletic upper body while preserving the source option and rig', () => {
    const source = fixture();
    const positions = new THREE.Float32BufferAttribute([
      0.2, 0.1, 0.14,
      0.2, 1.25, 0.14,
      0.2, 1.7, 0.14,
      0.1, 1.2, 0.14,
      0.2, 1.24, 0.14,
      0.15, 1.3, 0.14,
    ], 3);
    source.geometry.setAttribute('position', positions);
    source.geometry.setAttribute('normal', new THREE.Float32BufferAttribute(Array.from({ length: positions.count }, () => [0, 0, 1]).flat(), 3));
    source.geometry.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(Array.from({ length: positions.count }, () => [0, 0, 0, 0]).flat(), 4));
    source.geometry.setAttribute('skinWeight', new THREE.Float32BufferAttribute(Array.from({ length: positions.count }, () => [1, 0, 0, 0]).flat(), 4));
    source.geometry.setIndex([0, 1, 2, 3, 4, 5]);
    const options = { bodyScene: source.bodyScene, hairScene: source.hairScene,
      color: '#1d5ab2', number: null, kitStyle: 'solid' as const };
    const athletic = createRiggedPlayer({ ...options, silhouette: 'athletic' });
    const original = createRiggedPlayer({ ...options, silhouette: 'source' });
    const athleticBody = athletic.root.getObjectByName('Body') as THREE.SkinnedMesh;
    const originalBody = original.root.getObjectByName('Body') as THREE.SkinnedMesh;
    const athleticPositions = athleticBody.geometry.getAttribute('position');
    const originalPositions = originalBody.geometry.getAttribute('position');

    expect(athleticPositions.count).toBe(positions.count);
    expect(athleticPositions.getX(1)).toBeLessThan(originalPositions.getX(1));
    expect(athleticPositions.getZ(1)).toBeLessThan(originalPositions.getZ(1));
    for (const index of [0, 2]) {
      expect(athleticPositions.getX(index)).toBeCloseTo(originalPositions.getX(index));
      expect(athleticPositions.getZ(index)).toBeCloseTo(originalPositions.getZ(index));
    }
    for (let index = 0; index < positions.count; index += 1) {
      expect(athleticPositions.getY(index)).toBeCloseTo(positions.getY(index));
      expect(originalPositions.getX(index)).toBeCloseTo(positions.getX(index));
      expect(originalPositions.getZ(index)).toBeCloseTo(positions.getZ(index));
    }
    const shirt = athletic.root.getObjectByName('AuditionShirt') as THREE.SkinnedMesh;
    expect(shirt).toBeInstanceOf(THREE.SkinnedMesh);
    expect(shirt.skeleton).toBe(athleticBody.skeleton);
    expect(shirt.bindMatrix.equals(athleticBody.bindMatrix)).toBe(true);
    expect(shirt.geometry.getIndex()?.count).toBe(3);
    const shirtPositions = shirt.geometry.getAttribute('position');
    const bodyNormals = athleticBody.geometry.getAttribute('normal');
    for (const index of [3, 4, 5]) {
      expect(athleticPositions.getX(index)).toBeLessThan(originalPositions.getX(index));
      expect(athleticPositions.getZ(index)).toBeLessThan(originalPositions.getZ(index));
      expect(shirtPositions.getX(index)).toBeCloseTo(athleticPositions.getX(index) + bodyNormals.getX(index) * 0.012);
      expect(shirtPositions.getY(index)).toBeCloseTo(athleticPositions.getY(index) + bodyNormals.getY(index) * 0.012);
      expect(shirtPositions.getZ(index)).toBeCloseTo(athleticPositions.getZ(index) + bodyNormals.getZ(index) * 0.012);
    }
    expect(athletic.bones.has('Hips')).toBe(true);
    expect(athletic.bones.has('Head')).toBe(true);
    expect(athleticBody.geometry.getAttribute('skinIndex')).toBeTruthy();
    expect(athleticBody.geometry.getAttribute('skinWeight')).toBeTruthy();
    athletic.dispose();
    original.dispose();
  });

  it('clones independent skeletons and leaves source geometry and materials shared or unmodified', () => {
    const source = fixture();
    const options = { color: '#1d5ab2', number: 7, silhouette: 'athletic' as const, kitStyle: 'solid' as const };
    const first = createRiggedPlayer({ bodyScene: source.bodyScene, hairScene: source.hairScene, ...options });
    const second = createRiggedPlayer({ bodyScene: source.bodyScene, hairScene: source.hairScene, ...options, number: 9 });
    const firstHips = first.bones.get('Hips')!;
    const secondHips = second.bones.get('Hips')!;
    firstHips.rotation.x = 0.4;
    expect(Math.abs(secondHips.rotation.x)).toBe(0);
    expect(firstHips).not.toBe(secondHips);
    expect(source.bodyScene.getObjectByName('Hips')).not.toBe(firstHips);
    const sourceBody = source.bodyScene.getObjectByName('Body') as THREE.SkinnedMesh;
    const firstBody = first.root.getObjectByName('Body') as THREE.SkinnedMesh;
    expect(firstBody.geometry).not.toBe(sourceBody.geometry);
    expect(firstBody.material).not.toBe(sourceBody.material);
    expect(sourceBody.material).toBe(source.material);
    first.dispose();
    expect(second.root.getObjectByName('Body')).toBeTruthy();
    second.dispose();
  });

  it('disposes owned resources once without disposing cached source assets', () => {
    const source = fixture();
    const sourceGeometryDispose = vi.spyOn(source.geometry, 'dispose');
    const sourceMaterialDispose = vi.spyOn(source.material, 'dispose');
    const sourceHairGeometryDispose = vi.spyOn(source.hairGeometry, 'dispose');
    const sourceHairMaterialDispose = vi.spyOn(source.hairMaterial, 'dispose');
    const player = createRiggedPlayer({ bodyScene: source.bodyScene, hairScene: source.hairScene, color: '#d4ba3c', number: 9, silhouette: 'athletic', kitStyle: 'solid' });
    const body = player.root.getObjectByName('Body') as THREE.SkinnedMesh;
    const bodyGeometryDispose = vi.spyOn(body.geometry, 'dispose');
    const skeletonDispose = vi.spyOn(body.skeleton, 'dispose');
    const ownedMaterialDispose = vi.spyOn(body.material as THREE.Material, 'dispose');
    player.dispose();
    player.dispose();
    expect(bodyGeometryDispose).toHaveBeenCalledTimes(1);
    expect(skeletonDispose).toHaveBeenCalledTimes(1);
    expect(ownedMaterialDispose).toHaveBeenCalledTimes(1);
    expect(sourceGeometryDispose).not.toHaveBeenCalled();
    expect(sourceMaterialDispose).not.toHaveBeenCalled();
    expect(sourceHairGeometryDispose).not.toHaveBeenCalled();
    expect(sourceHairMaterialDispose).not.toHaveBeenCalled();
  });

  it('supports an explicitly unnumbered kit without making a number texture', () => {
    const source = fixture();
    const createElement = vi.spyOn(document, 'createElement');
    const player = createRiggedPlayer({ bodyScene: source.bodyScene, hairScene: source.hairScene,
      color: '#192325', number: null, silhouette: 'athletic', kitStyle: 'solid' });
    const body = player.root.getObjectByName('Body') as THREE.SkinnedMesh;
    expect(createElement).not.toHaveBeenCalled();
    expect(body.userData.auditionTexture).toBeUndefined();
    player.dispose();
  });
});
