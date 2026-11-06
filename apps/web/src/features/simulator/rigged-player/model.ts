import { clone as cloneSkeleton } from 'three/examples/jsm/utils/SkeletonUtils.js';
import * as THREE from 'three';

export type Silhouette = 'athletic' | 'source';
export type KitStyle = 'solid' | 'stripes' | 'sash';

function addSkinnedGarment(body: THREE.SkinnedMesh, kind: 'shirt' | 'shorts' | 'boots') {
  const geometry = body.geometry.clone();
  const positions = geometry.getAttribute('position');
  const normals = geometry.getAttribute('normal');
  const sourceIndex = geometry.getIndex();
  if (!sourceIndex || !normals) { geometry.dispose(); return; }
  const inside = (index: number) => {
    const y = positions.getY(index);
    const x = Math.abs(positions.getX(index));
    return kind === 'shirt'
      ? (y > 1.085 && y < 1.485 && x < 0.31) || (y > 1.37 && y < 1.49 && x < 0.46)
      : kind === 'shorts' ? y > 0.815 && y < 1.045 && x < 0.29
        : y < 0.155;
  };
  const indices: number[] = [];
  for (let i = 0; i < sourceIndex.count; i += 3) {
    const a = sourceIndex.getX(i);
    const b = sourceIndex.getX(i + 1);
    const c = sourceIndex.getX(i + 2);
    if (inside(a) && inside(b) && inside(c)) indices.push(a, b, c);
  }
  if (indices.length === 0) { geometry.dispose(); return; }
  geometry.setIndex(indices);
  const lift = kind === 'shirt' ? 0.012 : kind === 'shorts' ? 0.01 : 0.013;
  for (let i = 0; i < positions.count; i += 1) {
    positions.setXYZ(i,
      positions.getX(i) + normals.getX(i) * lift,
      positions.getY(i) + normals.getY(i) * lift,
      positions.getZ(i) + normals.getZ(i) * lift);
  }
  positions.needsUpdate = true;
  geometry.computeBoundingSphere();
  const shell = new THREE.SkinnedMesh(geometry, body.material);
  shell.name = `Audition${kind === 'shirt' ? 'Shirt' : kind === 'shorts' ? 'Shorts' : 'Boots'}`;
  shell.bindMode = body.bindMode;
  shell.bind(body.skeleton, body.bindMatrix.clone());
  shell.position.copy(body.position);
  shell.quaternion.copy(body.quaternion);
  shell.scale.copy(body.scale);
  shell.userData.auditionGeometry = true;
  shell.receiveShadow = true;
  body.parent?.add(shell);
}

function makeNumberTexture(number: number) {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 160;
  const context = canvas.getContext('2d');
  if (context) {
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.font = '900 116px Arial';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.strokeStyle = '#102820';
    context.lineWidth = 6;
    context.strokeText(String(number), 64, 84);
    context.fillStyle = '#ffffff';
    context.fillText(String(number), 64, 84);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.flipY = false;
  return texture;
}

function applyTrialKit(root: THREE.Object3D, color: string, number: number | null, silhouette: Silhouette, kitStyle: KitStyle) {
  let body: THREE.SkinnedMesh | null = null;
  root.traverse((object) => {
    if (!(object instanceof THREE.SkinnedMesh)) return;
    if (object.name.includes('Eyebrows')) {
      const material = (object.material as THREE.MeshStandardMaterial).clone();
      material.map = null;
      material.normalMap = null;
      material.color.set('#473528');
      material.roughness = 1;
      object.material = material;
      object.userData.auditionMaterial = true;
      return;
    }
    if (object.name.includes('Eyes')) {
      const material = (object.material as THREE.MeshStandardMaterial).clone();
      material.normalMap = null;
      material.roughness = 0.88;
      object.material = material;
      object.userData.auditionMaterial = true;
      return;
    }
    object.geometry.computeBoundingBox();
    if (!object.geometry.boundingBox || object.geometry.boundingBox.min.y > 0.2 || object.geometry.boundingBox.max.y < 1.6) return;
    const geometry = object.geometry.clone();
    const position = geometry.getAttribute('position');
    for (let index = 0; index < position.count; index += 1) {
      const x = Math.abs(position.getX(index));
      const y = position.getY(index);
      if (silhouette === 'athletic' && y > 1.02 && y < 1.62) {
        const vertical = Math.min(1, (y - 1.02) / 0.17, (1.62 - y) / 0.14);
        const breadth = Math.min(1, Math.max(0, (0.9 - x) / 0.22));
        const influence = vertical * breadth;
        position.setXYZ(index, position.getX(index) * (1 - influence * 0.15), y, position.getZ(index) * (1 - influence * 0.20));
      }
    }
    position.needsUpdate = true;
    if (silhouette === 'athletic') geometry.computeVertexNormals();
    geometry.computeBoundingSphere();
    object.geometry = geometry;
    object.userData.auditionGeometry = true;
    const material = (object.material as THREE.MeshStandardMaterial).clone();
    if (silhouette === 'athletic') material.normalMap = null;
    material.roughnessMap = null;
    material.metalnessMap = null;
    material.roughness = 0.9;
    material.metalness = 0;
    const primary = new THREE.Color(color);
    const secondary = new THREE.Color('#e9ede0');
    const numberTexture = number === null ? null : makeNumberTexture(number);
    const rgb = (value: THREE.Color) => `vec3(${value.r.toFixed(4)}, ${value.g.toFixed(4)}, ${value.b.toFixed(4)})`;
    const shirtPattern = kitStyle === 'stripes'
      ? `mix(${rgb(primary)}, ${rgb(secondary)}, step(0.5, mod(floor((vRestPosition.x + 0.5) / 0.09), 2.0)) * 0.88)`
      : kitStyle === 'sash'
        ? `mix(${rgb(primary)}, ${rgb(secondary)}, 1.0 - smoothstep(0.055, 0.07, abs(vRestPosition.x - (vRestPosition.y - 1.28) * 0.7)))`
        : rgb(primary);
    material.onBeforeCompile = (shader) => {
      if (numberTexture) shader.uniforms.numberMap = { value: numberTexture };
      shader.vertexShader = shader.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vRestPosition;');
      shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvRestPosition = position;');
      shader.fragmentShader = shader.fragmentShader.replace('#include <common>',
        `#include <common>\nvarying vec3 vRestPosition;${numberTexture ? '\nuniform sampler2D numberMap;' : ''}`);
      shader.fragmentShader = shader.fragmentShader.replace('#include <map_fragment>', `#include <map_fragment>
        float x = abs(vRestPosition.x);
        float y = vRestPosition.y;
        bool torso = y > 1.07 && y < 1.55 && x < 0.32;
        bool shoulder = y > 1.48 && y < 1.61 && x > 0.11 && x < 0.36;
        bool sleeve = y > 1.35 && y < 1.58 && x < 0.50;
        if (y < 0.16) diffuseColor.rgb = y < 0.035 ? vec3(0.075, 0.078, 0.075) : vec3(0.025, 0.035, 0.042);
        else if (torso || shoulder || sleeve) {
          diffuseColor.rgb = ${shirtPattern};
          if (sleeve && x > 0.465) diffuseColor.rgb = ${rgb(secondary)};
        } else if (y > 0.79 && y < 1.08 && x < 0.29) diffuseColor.rgb = vec3(0.035, 0.064, 0.087);
        else if (y > 0.17 && y < 0.62 && x < 0.24) {
          diffuseColor.rgb = ${rgb(primary)};
          if (y > 0.57) diffuseColor.rgb = ${rgb(secondary)};
        } else if (y > 1.58 && vRestPosition.z > 0.025) {
          float redBias = smoothstep(1.25, 1.65, diffuseColor.r / max(diffuseColor.g, 0.01));
          diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.52, 0.34, 0.25), redBias * 0.42);
        }
        ${numberTexture ? `if (vRestPosition.z < -0.075 && y > 1.21 && y < 1.47 && x < 0.17) {
          vec2 numberUv = vec2(1.0 - (vRestPosition.x + 0.17) / 0.34, 1.0 - (y - 1.21) / 0.26);
          vec4 numberInk = texture2D(numberMap, numberUv);
          diffuseColor.rgb = mix(diffuseColor.rgb, numberInk.rgb, numberInk.a);
        }` : ''}`);
    };
    material.customProgramCacheKey = () => `trial-kit-${color}-${silhouette}-${kitStyle}`;
    object.material = material;
    object.userData.auditionMaterial = true;
    if (numberTexture) object.userData.auditionTexture = numberTexture;
    object.castShadow = true;
    body = object;
  });
  if (body) {
    addSkinnedGarment(body, 'shirt');
    addSkinnedGarment(body, 'shorts');
    addSkinnedGarment(body, 'boots');
  }
}

export type RiggedPlayerOptions = Readonly<{ color: string; number: number | null; silhouette: Silhouette; kitStyle: KitStyle }>;

export function createRiggedPlayer({ bodyScene, hairScene, ...options }: RiggedPlayerOptions & { bodyScene: THREE.Group; hairScene: THREE.Group }) {
  const root = cloneSkeleton(bodyScene);
  applyTrialKit(root, options.color, options.number, options.silhouette, options.kitStyle);
  const head = root.getObjectByName('Head');
  if (head) {
    root.updateMatrixWorld(true);
    const hairObject = hairScene.clone(true);
    hairObject.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      const material = (object.material as THREE.MeshStandardMaterial).clone();
      material.color.set('#503a2c');
      object.material = material;
      object.userData.auditionMaterial = true;
      object.castShadow = true;
    });
    hairObject.applyMatrix4(head.matrixWorld.clone().invert());
    head.add(hairObject);
  }
  const bones = new Map<string, THREE.Bone>();
  root.traverse((object) => { if (object instanceof THREE.Bone) bones.set(object.name, object); });
  let disposed = false;
  return { root, bones, dispose: () => {
    if (disposed) return;
    disposed = true;
    disposeRiggedPlayer(root);
  } };
}

export function disposeRiggedPlayer(root: THREE.Object3D) {
  const skeletons = new Set<THREE.Skeleton>();
  const materials = new Set<THREE.Material>();
  const textures = new Set<THREE.Texture>();
  root.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    if (object instanceof THREE.SkinnedMesh) skeletons.add(object.skeleton);
    if (object.userData.auditionGeometry) object.geometry.dispose();
    if (object.userData.auditionMaterial) {
      for (const material of Array.isArray(object.material) ? object.material : [object.material]) materials.add(material);
    }
    if (object.userData.auditionTexture instanceof THREE.Texture) textures.add(object.userData.auditionTexture);
  });
  for (const skeleton of skeletons) skeleton.dispose();
  for (const material of materials) material.dispose();
  for (const texture of textures) texture.dispose();
}
