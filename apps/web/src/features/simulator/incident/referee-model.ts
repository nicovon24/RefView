import * as THREE from 'three';

/** Original procedural third-person referee. The caller owns its root and resources. */
export function createRefereeModel(): THREE.Group {
  const root = new THREE.Group();
  root.name = 'referee';
  const materials = new Map<string, THREE.MeshStandardMaterial>();
  const material = (color: string) => {
    let result = materials.get(color);
    if (!result) {
      result = new THREE.MeshStandardMaterial({
        color, roughness: 0.9, transparent: true, opacity: 0.25, depthWrite: false,
      });
      materials.set(color, result);
    }
    return result;
  };
  const add = (name: string, geometry: THREE.BufferGeometry, color: string,
    position: readonly [number, number, number], rotationZ = 0): THREE.Mesh => {
    const mesh = new THREE.Mesh(geometry, material(color));
    mesh.name = name;
    mesh.position.set(...position);
    mesh.rotation.z = rotationZ;
    root.add(mesh);
    return mesh;
  };
  const shirt = '#172525';
  const trim = '#697f78';
  const skin = '#c99774';
  const shorts = '#151e20';
  const socks = '#182425';
  add('torso', new THREE.CylinderGeometry(0.195, 0.145, 0.55, 16, 1), shirt, [0, 1.23, 0]);
  const shoulders = add('shoulders', new THREE.SphereGeometry(0.21, 16, 12), shirt, [0, 1.43, 0]);
  shoulders.scale.set(1.3, 0.42, 0.76);
  const waist = add('waist', new THREE.SphereGeometry(0.15, 14, 10), shorts, [0, 0.94, 0]);
  waist.scale.set(1.12, 0.66, 0.9);
  add('collar', new THREE.CylinderGeometry(0.077, 0.092, 0.065, 12), trim, [0, 1.54, 0]);
  add('neck', new THREE.CylinderGeometry(0.066, 0.068, 0.11, 12), skin, [0, 1.59, 0]);
  const head = add('head', new THREE.SphereGeometry(0.12, 16, 12), skin, [0, 1.72, 0]);
  head.scale.set(0.88, 1.08, 0.9);
  const hair = add('hair', new THREE.SphereGeometry(0.122, 16, 8, 0, Math.PI * 2, 0, Math.PI * 0.5),
    '#30251e', [0, 1.755, 0]);
  hair.scale.set(0.88, 1, 0.9);
  for (const side of ['left', 'right'] as const) {
    const sign = side === 'left' ? -1 : 1;
    const sleeve = add(`${side}Sleeve`, new THREE.CylinderGeometry(0.075, 0.07, 0.23, 12), shirt,
      [sign * 0.23, 1.36, 0], sign * 0.22);
    sleeve.scale.z = 0.9;
    add(`${side}Arm`, new THREE.CylinderGeometry(0.054, 0.041, 0.36, 12), skin,
      [sign * 0.285, 1.08, 0.005], sign * 0.16);
    add(`${side}Hand`, new THREE.SphereGeometry(0.047, 12, 10), skin,
      [sign * 0.315, 0.88, 0.01]);
    add(`${side}Shorts`, new THREE.CylinderGeometry(0.103, 0.085, 0.25, 12), shorts,
      [sign * 0.105, 0.81, 0]);
    add(`${side}Leg`, new THREE.CylinderGeometry(0.071, 0.057, 0.48, 12), skin,
      [sign * 0.105, 0.47, 0]);
    add(`${side}Sock`, new THREE.CylinderGeometry(0.06, 0.05, 0.22, 12), socks,
      [sign * 0.105, 0.2, 0]);
    const boot = add(`${side}Boot`, new THREE.SphereGeometry(0.086, 12, 8), '#111617',
      [sign * 0.105, 0.08, 0.055]);
    boot.scale.set(0.8, 0.56, 1.35);
  }
  return root;
}

export function disposeRefereeModel(root: THREE.Object3D): void {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  root.traverse((node) => {
    if (!(node instanceof THREE.Mesh)) return;
    geometries.add(node.geometry);
    for (const material of Array.isArray(node.material) ? node.material : [node.material])
      materials.add(material);
  });
  for (const geometry of geometries) geometry.dispose();
  for (const material of materials) material.dispose();
}
