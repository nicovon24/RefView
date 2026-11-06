import { describe, expect, it, vi } from 'vitest';
import * as THREE from 'three';
import { createIncidentEnvironment, mountIncidentEnvironment } from './environment';

const mesh = (root: THREE.Group, name: string): THREE.Mesh => {
  const object = root.getObjectByName(name);
  expect(object).toBeInstanceOf(THREE.Mesh);
  return object as THREE.Mesh;
};

describe('incident environment', () => {
  it('mounts the presentation layer and restores the previous scene state', () => {
    const scene = new THREE.Scene();
    const previousBackground = new THREE.Color('#123456');
    const previousFog = new THREE.Fog('#123456', 8, 20);
    scene.background = previousBackground;
    scene.fog = previousFog;
    const environment = createIncidentEnvironment();
    const dispose = vi.spyOn(environment, 'dispose');

    const unmount = mountIncidentEnvironment(scene, environment);
    expect(scene.children).toContain(environment.root);
    expect(scene.background).toBe(environment.background);
    expect(scene.fog).toBe(environment.fog);

    unmount();
    expect(scene.children).not.toContain(environment.root);
    expect(scene.background).toBe(previousBackground);
    expect(scene.fog).toBe(previousFog);
    expect(dispose).toHaveBeenCalledTimes(1);
  });
  it('retains the authored 105 x 68 pitch, stripes and line positions', () => {
    const environment = createIncidentEnvironment();
    const { root } = environment;
    expect((mesh(root, 'pitch').geometry as THREE.PlaneGeometry).parameters).toMatchObject({ width: 68, height: 105 });
    expect((mesh(root, 'runoff').geometry as THREE.BoxGeometry).parameters).toMatchObject({ width: 76, height: 0.09, depth: 113 });
    for (let i = 0; i < 10; i++) {
      const stripe = mesh(root, `stripe-${i}`);
      expect(stripe.position.z).toBeCloseTo(-47.25 + i * 10.5);
      expect((stripe.geometry as THREE.PlaneGeometry).parameters).toMatchObject({ width: 68, height: 10.5 });
    }
    for (const x of [-34, 34]) expect(mesh(root, `touchline-${x}`).position.x).toBe(x);
    for (const z of [-52.5, 0, 52.5]) expect(mesh(root, `crossline-${z}`).position.z).toBe(z);
    for (const side of [-1, 1]) {
      expect(mesh(root, `penalty-top-${side}`).position.z).toBe(side * 36);
      expect(mesh(root, `goal-area-top-${side}`).position.z).toBe(side * 47);
    }
    environment.dispose();
  });

  it('places both penalty marks, arcs, centre mark and corner features to Law 1 dimensions', () => {
    const environment = createIncidentEnvironment();
    const { root } = environment;
    const halfLength = 52.5;
    const lineWidth = 0.12;
    const markFromGoalLineBack = halfLength + lineWidth / 2 - 11;
    expect(mesh(root, 'center-mark').position).toMatchObject({ x: 0, z: 0 });
    for (const side of [-1, 1]) {
      const mark = mesh(root, `penalty-spot-${side}`);
      expect(mark.position.z).toBeCloseTo(side * markFromGoalLineBack, 5);
      expect((mark.geometry as THREE.CircleGeometry).parameters.radius).toBeLessThanOrEqual(lineWidth);
      const arc = mesh(root, `penalty-arc-${side}`);
      const positions = arc.geometry.getAttribute('position');
      expect(positions.count).toBeGreaterThan(40);
      for (let i = 0; i < positions.count; i++) {
        const x = positions.getX(i);
        const z = positions.getZ(i);
        expect(Math.abs(Math.hypot(x, z - side * markFromGoalLineBack) - 9.15)).toBeLessThanOrEqual(lineWidth / 2 + 0.001);
        expect(side * z).toBeLessThanOrEqual(36.2);
      }
    }
    for (const xSide of [-1, 1]) for (const zSide of [-1, 1]) {
      const arc = mesh(root, `corner-arc-${xSide}-${zSide}`);
      const positions = arc.geometry.getAttribute('position');
      expect(positions.count).toBeGreaterThan(20);
      for (let i = 0; i < positions.count; i++) {
        const x = positions.getX(i);
        const z = positions.getZ(i);
        expect(Math.abs(Math.hypot(x - xSide * 34, z - zSide * halfLength) - 1)).toBeLessThanOrEqual(lineWidth / 2 + 0.001);
        expect(Math.abs(x)).toBeLessThanOrEqual(34.01);
        expect(Math.abs(z)).toBeLessThanOrEqual(halfLength + 0.01);
      }
      const post = mesh(root, `corner-flagpost-${xSide}-${zSide}`);
      expect(post.position.x).toBe(xSide * 34);
      expect(post.position.z).toBe(zSide * halfLength);
      expect((post.geometry as THREE.CylinderGeometry).parameters.height).toBeGreaterThanOrEqual(1.5);
    }
    environment.dispose();
  });

  it('has exact clear goal dimensions and net behind each goal line', () => {
    const environment = createIncidentEnvironment();
    for (const side of [-1, 1]) {
      const left = mesh(environment.root, `goal-${side}-post--1`);
      const right = mesh(environment.root, `goal-${side}-post-1`);
      const crossbar = mesh(environment.root, `goal-${side}-crossbar`);
      const radius = (left.geometry as THREE.CylinderGeometry).parameters.radiusTop;
      expect(right.position.x - left.position.x - 2 * radius).toBeCloseTo(7.32);
      expect(left.position.z).toBe(side * 52.5);
      expect(right.position.z).toBe(side * 52.5);
      expect(crossbar.position.y - radius).toBeCloseTo(2.44);
      const net = environment.root.getObjectByName(`goal-${side}-net`);
      expect(net).toBeInstanceOf(THREE.LineSegments);
      const bounds = new THREE.Box3().setFromObject(net!);
      expect(side * (side > 0 ? bounds.max.z : bounds.min.z)).toBeCloseTo(54.6);
    }
    environment.dispose();
  });

  it('keeps perimeter structures beyond play and bounds presentation cost', () => {
    const environment = createIncidentEnvironment();
    for (const side of [-1, 1]) {
      for (const name of [`sideline-board-${side}`, `side-concourse-${side}`,
        ...Array.from({ length: 5 }, (_, row) => `side-stand-${side}-${row}`)]) {
        const object = environment.root.getObjectByName(name)!;
        const bounds = new THREE.Box3().setFromObject(object);
        if (side > 0) expect(bounds.min.x).toBeGreaterThan(34);
        else expect(bounds.max.x).toBeLessThan(-34);
      }
      for (const name of [`endline-board-${side}`, `end-concourse-${side}`,
        ...Array.from({ length: 5 }, (_, row) => `end-stand-${side}-${row}`)]) {
        const object = environment.root.getObjectByName(name)!;
        const bounds = new THREE.Box3().setFromObject(object);
        if (side > 0) expect(bounds.min.z).toBeGreaterThan(52.5);
        else expect(bounds.max.z).toBeLessThan(-52.5);
      }
      for (let row = 1; row < 5; row++) {
        const previous = new THREE.Box3().setFromObject(mesh(environment.root, `side-stand-${side}-${row - 1}`));
        const current = new THREE.Box3().setFromObject(mesh(environment.root, `side-stand-${side}-${row}`));
        expect(current.max.y).toBeGreaterThan(previous.max.y);
        expect(Math.abs(mesh(environment.root, `side-stand-${side}-${row}`).position.x))
          .toBeGreaterThan(Math.abs(mesh(environment.root, `side-stand-${side}-${row - 1}`).position.x));
      }
      const lower = new THREE.Box3().setFromObject(mesh(environment.root, `side-stand-${side}-4`));
      const upper = new THREE.Box3().setFromObject(mesh(environment.root, `upper-side-stand-${side}-0`));
      expect(upper.min.y - lower.max.y).toBeGreaterThan(1);
      expect(upper.max.y).toBeGreaterThan(8);
      for (const name of [`side-back-wall-${side}`, `side-roof-${side}`, `upper-side-stand-${side}-3`]) {
        const bounds = new THREE.Box3().setFromObject(mesh(environment.root, name));
        if (side > 0) expect(bounds.min.x).toBeGreaterThan(34);
        else expect(bounds.max.x).toBeLessThan(-34);
      }
    }
    expect(environment.root.getObjectByName('stand-row-edges-and-aisles')).toBeInstanceOf(THREE.LineSegments);
    const drawables = environment.root.children.filter((child) => child instanceof THREE.Mesh || child instanceof THREE.LineSegments);
    // Regulation marks and four corner flags add a bounded number of static calls.
    expect(drawables.length).toBeLessThan(145);
    const triangles = drawables.reduce((total, object) => {
      if (!(object instanceof THREE.Mesh)) return total;
      const geometry = object.geometry as THREE.BufferGeometry;
      const faces = (geometry.index?.count ?? geometry.getAttribute('position').count) / 3;
      return total + faces * (object instanceof THREE.InstancedMesh ? object.count : 1);
    }, 0);
    expect(triangles).toBeLessThan(16000);
    expect(environment.root.children.filter((child) => child instanceof THREE.Light)).toHaveLength(2);
    environment.dispose();
  });

  it('batches a deterministic static crowd beyond play', () => {
    const first = createIncidentEnvironment();
    const second = createIncidentEnvironment();
    let spectators = 0;
    for (let index = 0; index < 4; index++) {
      const a = first.root.getObjectByName(`stadium-crowd-${index}`);
      const b = second.root.getObjectByName(`stadium-crowd-${index}`);
      expect(a).toBeInstanceOf(THREE.InstancedMesh);
      expect(b).toBeInstanceOf(THREE.InstancedMesh);
      const batch = a as THREE.InstancedMesh;
      spectators += batch.count;
      expect(batch.count).toBe((b as THREE.InstancedMesh).count);
      expect(Array.from(batch.instanceMatrix.array)).toEqual(Array.from((b as THREE.InstancedMesh).instanceMatrix.array));
      for (let instance = 0; instance < batch.count; instance++) {
        const matrix = new THREE.Matrix4();
        batch.getMatrixAt(instance, matrix);
        const position = new THREE.Vector3().setFromMatrixPosition(matrix);
        expect(Math.abs(position.x) > 39 || Math.abs(position.z) > 58).toBe(true);
      }
    }
    expect(spectators).toBeGreaterThan(400);
    expect(spectators).toBeLessThan(1000);
    const colors = Array.from({ length: 4 }, (_, index) =>
      ((first.root.getObjectByName(`stadium-crowd-${index}`) as THREE.InstancedMesh).material as THREE.MeshBasicMaterial).color.getHexString());
    expect(new Set(colors).size).toBe(4);
    first.dispose();
    second.dispose();
  });

  it('spreads sparse crowd heads across both sides of the venue', () => {
    const environment = createIncidentEnvironment();
    const xs: number[] = [];
    for (let color = 0; color < 4; color++) {
      const heads = environment.root.getObjectByName(`stadium-crowd-heads-${color}`) as THREE.InstancedMesh;
      expect(heads).toBeInstanceOf(THREE.InstancedMesh);
      for (let index = 0; index < heads.count; index++) {
        const matrix = new THREE.Matrix4();
        heads.getMatrixAt(index, matrix);
        xs.push(new THREE.Vector3().setFromMatrixPosition(matrix).x);
      }
    }
    expect(Math.min(...xs)).toBeLessThan(-39);
    expect(Math.max(...xs)).toBeGreaterThan(39);
    environment.dispose();
  });

  it('reduces head detail by camera distance while keeping pooled body batches', () => {
    const environment = createIncidentEnvironment();
    const heads = environment.root.getObjectByName('stadium-crowd-heads-0') as THREE.InstancedMesh;
    const body = environment.root.getObjectByName('stadium-crowd-0') as THREE.InstancedMesh;
    const originalBodies = body.count;
    const camera = new THREE.PerspectiveCamera();
    const renderHeads = () => heads.onBeforeRender(null!, null!, camera, heads.geometry, heads.material as THREE.Material, null!);
    camera.position.set(0, 2, 0);
    renderHeads();
    const centralCount = heads.count;
    camera.position.set(120, 2, 0);
    renderHeads();
    expect(heads.count).toBeLessThan(centralCount);
    expect(body.count).toBe(originalBodies);
    environment.dispose();
  });

  it('bridges all four seating and roof corners with three instanced batches', () => {
    const environment = createIncidentEnvironment();
    for (const name of ['lower-corner-stands', 'corner-concourse-bridges', 'upper-corner-stands', 'corner-roof-caps']) {
      const batch = environment.root.getObjectByName(name);
      expect(batch).toBeInstanceOf(THREE.InstancedMesh);
      expect((batch as THREE.InstancedMesh).count).toBe(4);
    }
    const bridge = environment.root.getObjectByName('corner-concourse-bridges') as THREE.InstancedMesh;
    const lower = environment.root.getObjectByName('lower-corner-stands') as THREE.InstancedMesh;
    const upper = environment.root.getObjectByName('upper-corner-stands') as THREE.InstancedMesh;
    const instanceBounds = (batch: THREE.InstancedMesh, index: number) => {
      const matrix = new THREE.Matrix4();
      batch.getMatrixAt(index, matrix);
      return new THREE.Box3().setFromBufferAttribute(batch.geometry.getAttribute('position') as THREE.BufferAttribute)
        .applyMatrix4(matrix);
    };
    for (let index = 0; index < bridge.count; index++) {
      expect(instanceBounds(bridge, index).intersectsBox(instanceBounds(lower, index))).toBe(true);
      expect(instanceBounds(bridge, index).intersectsBox(instanceBounds(upper, index))).toBe(true);
    }
    const caps = environment.root.getObjectByName('corner-roof-caps') as THREE.InstancedMesh;
    for (let index = 0; index < caps.count; index++) {
      const matrix = new THREE.Matrix4();
      caps.getMatrixAt(index, matrix);
      const center = new THREE.Vector3().setFromMatrixPosition(matrix);
      const xSide = Math.sign(center.x);
      const zSide = Math.sign(center.z);
      const capBounds = new THREE.Box3().setFromBufferAttribute(caps.geometry.getAttribute('position') as THREE.BufferAttribute).applyMatrix4(matrix);
      const sideRoof = new THREE.Box3().setFromObject(mesh(environment.root, `side-roof-${xSide}`));
      const endRoof = new THREE.Box3().setFromObject(mesh(environment.root, `end-roof-${zSide}`));
      expect(capBounds.intersectsBox(sideRoof)).toBe(true);
      expect(capBounds.intersectsBox(endRoof)).toBe(true);
      const upperCorners = environment.root.getObjectByName('upper-corner-stands') as THREE.InstancedMesh;
      const upperMatrix = new THREE.Matrix4();
      upperCorners.getMatrixAt(index, upperMatrix);
      const upperBounds = new THREE.Box3().setFromBufferAttribute(
        upperCorners.geometry.getAttribute('position') as THREE.BufferAttribute).applyMatrix4(upperMatrix);
      expect(capBounds.min.y - upperBounds.max.y).toBeLessThan(0.1);
    }
    environment.dispose();
  });

  it('gives upper corners stepped seating and owns a camera-following daylight sky', () => {
    const environment = createIncidentEnvironment();
    const steps = environment.root.getObjectByName('upper-corner-seat-steps') as THREE.InstancedMesh;
    expect(steps).toBeInstanceOf(THREE.InstancedMesh);
    expect(steps.count).toBeGreaterThanOrEqual(16);
    const heights = new Set<number>();
    const matrix = new THREE.Matrix4();
    for (let index = 0; index < steps.count; index++) {
      steps.getMatrixAt(index, matrix);
      heights.add(Number(new THREE.Vector3().setFromMatrixPosition(matrix).y.toFixed(2)));
    }
    expect(heights.size).toBeGreaterThanOrEqual(4);
    const sky = environment.root.getObjectByName('stadium-daylight-sky') as THREE.Mesh;
    expect(sky).toBeInstanceOf(THREE.Mesh);
    expect((sky.material as THREE.MeshBasicMaterial).fog).toBe(false);
    expect(sky.frustumCulled).toBe(false);
    environment.dispose();
  });

  it('uses shared fixed grass grain with mip filtering and gentle mowing contrast', () => {
    const first = createIncidentEnvironment();
    const second = createIncidentEnvironment();
    const dark = mesh(first.root, 'stripe-0').material as THREE.MeshStandardMaterial;
    const light = mesh(first.root, 'stripe-1').material as THREE.MeshStandardMaterial;
    const pitch = mesh(first.root, 'pitch').material as THREE.MeshStandardMaterial;
    expect(dark.map).toBe(light.map);
    expect(pitch.map).toBe(dark.map);
    expect(dark.color.getHexString()).not.toBe(light.color.getHexString());
    expect(dark.map?.minFilter).toBe(THREE.LinearMipmapLinearFilter);
    expect(dark.map?.generateMipmaps).toBe(true);
    expect(dark.map?.wrapS).toBe(THREE.RepeatWrapping);
    expect(dark.map?.wrapT).toBe(THREE.RepeatWrapping);
    expect(dark.map?.repeat.x).toBe(68 / 4);
    expect(dark.map?.repeat.y).toBe(10.5 / 3.5);
    expect(dark.normalMap).toBe(light.normalMap);
    expect(dark.roughnessMap).toBe(light.roughnessMap);
    expect(dark.normalMap?.colorSpace).toBe(THREE.NoColorSpace);
    expect(dark.roughnessMap?.colorSpace).toBe(THREE.NoColorSpace);
    expect(dark.normalScale.x).toBeLessThan(0.5);
    expect(dark.roughness).toBeGreaterThan(0.9);
    const pixels = (dark.map as THREE.DataTexture).image.data as Uint8Array;
    const secondPixels = (((mesh(second.root, 'pitch').material as THREE.MeshStandardMaterial).map as THREE.DataTexture).image.data) as Uint8Array;
    expect(pixels).toEqual(secondPixels);
    const redSamples = Array.from({ length: 64 }, (_, index) => pixels[index * 4]!);
    expect(Math.max(...redSamples) - Math.min(...redSamples)).toBeLessThan(20);
    first.dispose();
    second.dispose();
  });

  it('owns and disposes each geometry, material, texture and instance buffer exactly once', () => {
    const environment = createIncidentEnvironment();
    const sun = environment.root.getObjectByName('stadium-sun') as THREE.DirectionalLight;
    const shadowDispose = vi.spyOn(sun.shadow, 'dispose');
    const geometries = new Set<THREE.BufferGeometry>();
    const materials = new Set<THREE.Material>();
    const textures = new Set<THREE.Texture>();
    const instances: THREE.InstancedMesh[] = [];
    environment.root.traverse((object) => {
      if (!(object instanceof THREE.Mesh || object instanceof THREE.LineSegments)) return;
      if (object instanceof THREE.InstancedMesh) instances.push(object);
      geometries.add(object.geometry);
      for (const material of Array.isArray(object.material) ? object.material : [object.material]) materials.add(material);
    });
    for (const material of materials) if (material instanceof THREE.MeshStandardMaterial) {
      if (material.map) textures.add(material.map);
      if (material.normalMap) textures.add(material.normalMap);
      if (material.roughnessMap) textures.add(material.roughnessMap);
    }
    const spies = [...geometries, ...materials, ...textures, ...instances].map((resource) => vi.spyOn(resource, 'dispose'));
    environment.dispose();
    environment.dispose();
    for (const spy of spies) expect(spy).toHaveBeenCalledTimes(1);
    expect(shadowDispose).toHaveBeenCalledTimes(1);
  });
});
