import * as THREE from 'three';
import { createGrassSurface } from './grass-surface';

/** Original, procedural presentation shared by the authoring and local-playtest scenes. */
export function createIncidentEnvironment(): {
  root: THREE.Group;
  background: THREE.Color;
  fog: THREE.Fog;
  dispose(): void;
} {
  const root = new THREE.Group();
  root.name = 'incident-environment';
  const background = new THREE.Color('#384f4d');
  const fog = new THREE.Fog('#384f4d', 95, 190);
  const materials = new Set<THREE.Material>();
  const geometries = new Set<THREE.BufferGeometry>();
  const textures = new Set<THREE.Texture>();
  const instances = new Set<THREE.InstancedMesh>();
  const standard = (color: string) => {
    const material = new THREE.MeshStandardMaterial({ color, roughness: 1 });
    materials.add(material);
    return material;
  };
  const basic = (color: string) => {
    const material = new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide });
    materials.add(material);
    return material;
  };
  const grass = createGrassSurface();
  const { turf, stripeDark, stripeLight } = grass;
  for (const material of grass.materials) materials.add(material);
  for (const texture of grass.textures) textures.add(texture);
  const runoff = standard('#325a43');
  const white = basic('#f7f5de');
  const goalWhite = standard('#e8e8dc');
  const standRows = [basic('#2c4545'), basic('#304a49'), basic('#344f4d'), basic('#2d4847'), basic('#324c49')];
  const upperRows = [basic('#263b3d'), basic('#2a4041'), basic('#2d4444'), basic('#283d3e')];
  const standMid = standard('#344846');
  const board = basic('#29403c');
  const concourse = basic('#202f30');
  const structure = basic('#263839');
  const roof = basic('#1d2d30');
  const aisleMaterial = basic('#68736b');
  const seatEdge = new THREE.LineBasicMaterial({ color: '#87988a', transparent: true, opacity: 0.6, depthWrite: false });
  materials.add(seatEdge);
  const netMaterial = new THREE.LineBasicMaterial({ color: '#b7c8ba', transparent: true, opacity: 0.33, depthWrite: false });
  materials.add(netMaterial);

  const add = <T extends THREE.Object3D>(object: T, name: string): T => {
    object.name = name;
    if (object instanceof THREE.InstancedMesh) instances.add(object);
    root.add(object);
    return object;
  };
  const box = (name: string, x: number, y: number, z: number, w: number, h: number, d: number, material: THREE.Material) => {
    const geometry = new THREE.BoxGeometry(w, h, d);
    geometries.add(geometry);
    const mesh = add(new THREE.Mesh(geometry, material), name);
    mesh.position.set(x, y, z);
    return mesh;
  };
  const plane = (name: string, x: number, y: number, z: number, w: number, d: number, material: THREE.Material) => {
    const geometry = new THREE.PlaneGeometry(w, d);
    geometries.add(geometry);
    const mesh = add(new THREE.Mesh(geometry, material), name);
    mesh.position.set(x, y, z);
    mesh.rotation.x = -Math.PI / 2;
    return mesh;
  };
  const pole = (name: string, start: THREE.Vector3, end: THREE.Vector3, radius: number, material: THREE.Material) => {
    const direction = new THREE.Vector3().subVectors(end, start);
    const geometry = new THREE.CylinderGeometry(radius, radius, direction.length(), 10);
    geometries.add(geometry);
    const mesh = add(new THREE.Mesh(geometry, material), name);
    mesh.position.copy(start).add(end).multiplyScalar(0.5);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
    return mesh;
  };
  const groundArc = (name: string, centerX: number, centerZ: number, radius: number,
    start: number, end: number, segments: number) => {
    const points: number[] = [];
    const indices: number[] = [];
    for (let step = 0; step <= segments; step++) {
      const angle = start + (end - start) * step / segments;
      for (const edge of [-0.06, 0.06]) {
        const distance = radius + edge;
        points.push(centerX + Math.cos(angle) * distance, 0.021, centerZ + Math.sin(angle) * distance);
      }
      if (step < segments) {
        const current = step * 2;
        indices.push(current, current + 1, current + 2, current + 1, current + 3, current + 2);
      }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
    geometry.setIndex(indices);
    geometries.add(geometry);
    return add(new THREE.Mesh(geometry, white), name);
  };

  add(new THREE.HemisphereLight('#f5f2dc', '#30513e', 2.1), 'stadium-ambient');
  const sun = add(new THREE.DirectionalLight('#ffffff', 2.2), 'stadium-sun');
  sun.position.set(28, 68, 35);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -78;
  sun.shadow.camera.right = 78;
  sun.shadow.camera.top = 78;
  sun.shadow.camera.bottom = -78;
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 180;
  sun.shadow.normalBias = 0.015;
  sun.shadow.bias = -0.0001;
  sun.shadow.radius = 2;

  box('runoff', 0, -0.055, 0, 76, 0.09, 113, runoff);
  plane('pitch', 0, 0, 0, 68, 105, turf).receiveShadow = true;
  for (let i = 0; i < 10; i++) {
    plane(`stripe-${i}`, 0, 0.003, -47.25 + i * 10.5, 68, 10.5, i % 2 ? stripeLight : stripeDark).receiveShadow = true;
  }
  for (const x of [-34, 34]) box(`touchline-${x}`, x, 0.014, 0, 0.12, 0.012, 105, white);
  for (const z of [-52.5, 0, 52.5]) box(`crossline-${z}`, 0, 0.014, z, 68, 0.012, 0.12, white);
  const centerGeometry = new THREE.RingGeometry(9.09, 9.21, 64);
  geometries.add(centerGeometry);
  const centerCircle = add(new THREE.Mesh(centerGeometry, white), 'center-circle');
  centerCircle.rotation.x = -Math.PI / 2;
  centerCircle.position.y = 0.018;
  const markGeometry = new THREE.CircleGeometry(0.1, 16);
  geometries.add(markGeometry);
  const centerMark = add(new THREE.Mesh(markGeometry, white), 'center-mark');
  centerMark.rotation.x = -Math.PI / 2;
  centerMark.position.y = 0.022;
  const penaltyMarkDistance = 52.5 + 0.06 - 11;
  const penaltyArcHalfAngle = Math.acos(5.5 / 9.15);
  for (const side of [-1, 1]) {
    box(`penalty-top-${side}`, 0, 0.014, side * 36, 40.32, 0.012, 0.12, white);
    for (const x of [-20.16, 20.16]) box(`penalty-side-${side}-${x}`, x, 0.014, side * 44.25, 0.12, 0.012, 16.5, white);
    box(`goal-area-top-${side}`, 0, 0.014, side * 47, 18.32, 0.012, 0.12, white);
    for (const x of [-9.16, 9.16]) box(`goal-area-side-${side}-${x}`, x, 0.014, side * 49.75, 0.12, 0.012, 5.5, white);
    const penaltyMark = add(new THREE.Mesh(markGeometry, white), `penalty-spot-${side}`);
    penaltyMark.rotation.x = -Math.PI / 2;
    penaltyMark.position.set(0, 0.022, side * penaltyMarkDistance);
    const arcDirection = side > 0 ? -Math.PI / 2 : Math.PI / 2;
    groundArc(`penalty-arc-${side}`, 0, side * penaltyMarkDistance, 9.15,
      arcDirection - penaltyArcHalfAngle, arcDirection + penaltyArcHalfAngle, 48);
  }
  const flagMaterial = basic('#e8e8dc');
  for (const xSide of [-1, 1]) for (const zSide of [-1, 1]) {
    const start = xSide > 0 ? (zSide > 0 ? Math.PI : Math.PI / 2) : (zSide > 0 ? -Math.PI / 2 : 0);
    groundArc(`corner-arc-${xSide}-${zSide}`, xSide * 34, zSide * 52.5, 1, start, start + Math.PI / 2, 16);
    const post = pole(`corner-flagpost-${xSide}-${zSide}`,
      new THREE.Vector3(xSide * 34, 0, zSide * 52.5),
      new THREE.Vector3(xSide * 34, 1.5, zSide * 52.5), 0.02, goalWhite);
    post.castShadow = false;
    const fabricGeometry = new THREE.PlaneGeometry(0.42, 0.24);
    geometries.add(fabricGeometry);
    const flag = add(new THREE.Mesh(fabricGeometry, flagMaterial), `corner-flag-${xSide}-${zSide}`);
    flag.position.set(xSide * 34 - xSide * 0.21, 1.36, zSide * 52.5);
  }

  const postRadius = 0.06;
  const openingHalf = 7.32 / 2;
  const crossbarBottom = 2.44;
  const goalDepth = 2.1;
  for (const side of [-1, 1]) {
    const frontZ = side * 52.5;
    const rearZ = side * (52.5 + goalDepth);
    for (const xSign of [-1, 1]) {
      const x = xSign * (openingHalf + postRadius);
      pole(`goal-${side}-post-${xSign}`, new THREE.Vector3(x, 0, frontZ), new THREE.Vector3(x, crossbarBottom + postRadius, frontZ), postRadius, goalWhite).castShadow = true;
      pole(`goal-${side}-rear-support-${xSign}`, new THREE.Vector3(x, 0, rearZ), new THREE.Vector3(x, crossbarBottom + postRadius, rearZ), 0.035, standMid);
      pole(`goal-${side}-top-depth-${xSign}`, new THREE.Vector3(x, crossbarBottom + postRadius, frontZ), new THREE.Vector3(x, crossbarBottom + postRadius, rearZ), 0.03, standMid);
    }
    pole(`goal-${side}-crossbar`, new THREE.Vector3(-openingHalf - postRadius, crossbarBottom + postRadius, frontZ), new THREE.Vector3(openingHalf + postRadius, crossbarBottom + postRadius, frontZ), postRadius, goalWhite).castShadow = true;
    const netVertices: number[] = [];
    const segment = (a: [number, number, number], b: [number, number, number]) => netVertices.push(...a, ...b);
    const widthSteps = 12;
    const heightSteps = 5;
    const depthSteps = 4;
    const left = -openingHalf - postRadius;
    const right = openingHalf + postRadius;
    const top = crossbarBottom + postRadius;
    for (let i = 0; i <= widthSteps; i++) {
      const x = left + (right - left) * i / widthSteps;
      segment([x, 0, rearZ], [x, top, rearZ]);
      segment([x, top, frontZ], [x, top, rearZ]);
    }
    for (let j = 0; j <= heightSteps; j++) {
      const y = top * j / heightSteps;
      segment([left, y, rearZ], [right, y, rearZ]);
      for (const x of [left, right]) segment([x, y, frontZ], [x, y, rearZ]);
    }
    for (let k = 0; k <= depthSteps; k++) {
      const z = frontZ + (rearZ - frontZ) * k / depthSteps;
      segment([left, top, z], [right, top, z]);
      for (const x of [left, right]) segment([x, 0, z], [x, top, z]);
    }
    const netGeometry = new THREE.BufferGeometry();
    netGeometry.setAttribute('position', new THREE.Float32BufferAttribute(netVertices, 3));
    geometries.add(netGeometry);
    add(new THREE.LineSegments(netGeometry, netMaterial), `goal-${side}-net`);
  }

  // A camera-centred shell stays inside the 160 m camera far plane. Vertex
  // colour gives daylight depth without a texture, shader pass, or horizon seam.
  const skyGeometry = new THREE.SphereGeometry(140, 16, 8);
  const skyPositions = skyGeometry.getAttribute('position');
  const skyColors = new Float32Array(skyPositions.count * 3);
  const horizon = new THREE.Color('#afc8d0');
  const zenith = new THREE.Color('#699bbd');
  const skyColor = new THREE.Color();
  for (let index = 0; index < skyPositions.count; index++) {
    const altitude = Math.max(0, skyPositions.getY(index) / 140);
    skyColor.copy(horizon).lerp(zenith, Math.pow(altitude, 0.65));
    skyColors[index * 3] = skyColor.r;
    skyColors[index * 3 + 1] = skyColor.g;
    skyColors[index * 3 + 2] = skyColor.b;
  }
  skyGeometry.setAttribute('color', new THREE.BufferAttribute(skyColors, 3));
  geometries.add(skyGeometry);
  const skyMaterial = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide,
    fog: false, depthTest: false, depthWrite: false, toneMapped: false });
  materials.add(skyMaterial);
  const sky = add(new THREE.Mesh(skyGeometry, skyMaterial), 'stadium-daylight-sky');
  sky.frustumCulled = false;
  sky.renderOrder = -100;
  sky.onBeforeRender = (_renderer, _scene, camera) => {
    sky.position.copy(camera.position);
    sky.updateMatrixWorld();
  };

  // Two original terrace rings, with a clear dark concourse between them.
  // The row and aisle lines share one draw call.
  const standMarks: number[] = [];
  const mark = (a: [number, number, number], b: [number, number, number]) => standMarks.push(...a, ...b);
  const crowdMatrices: THREE.Matrix4[][] = Array.from({ length: 4 }, () => []);
  const crowdPosition = new THREE.Vector3();
  const crowdScale = new THREE.Vector3();
  const crowdMatrix = new THREE.Matrix4();
  const crowdRotation = new THREE.Quaternion();
  let crowdSeed = 0x53a719;
  const random = () => {
    crowdSeed = (Math.imul(crowdSeed, 1664525) + 1013904223) >>> 0;
    return crowdSeed / 0x100000000;
  };
  const populate = (axis: 'x' | 'z', ringSide: number, rowCenter: number, rowHeight: number, halfSpan: number, tier: number) => {
    const spacing = tier === 0 ? 1.65 : 1.8;
    for (let along = -halfSpan + spacing; along < halfSpan - spacing; along += spacing) {
      if (Math.abs(along) < 1.2 || Math.abs(Math.abs(along) - halfSpan / 2) < 1.2 || random() > 0.46) continue;
      const size = 0.46 + random() * 0.24;
      if (axis === 'x') crowdPosition.set(ringSide * rowCenter, rowHeight + size * 0.5 + 0.04, along);
      else crowdPosition.set(along, rowHeight + size * 0.5 + 0.04, ringSide * rowCenter);
      crowdScale.set(0.34 + random() * 0.13, size, 0.24 + random() * 0.08);
      crowdMatrix.compose(crowdPosition, crowdRotation, crowdScale);
      crowdMatrices[Math.floor(random() * crowdMatrices.length)]!.push(crowdMatrix.clone());
    }
  };
  for (const side of [-1, 1]) {
    box(`sideline-board-${side}`, side * 38.7, 0.56, 0, 0.22, 1.12, 116, board);
    box(`endline-board-${side}`, 0, 0.56, side * 57.3, 76, 1.12, 0.22, board);
    for (let row = 0; row < 5; row++) {
      const height = 1.55 + row * 0.82;
      const sideCenter = 40.25 + row * 1.48;
      const endCenter = 59.3 + row * 1.48;
      const material = standRows[row]!;
      box(`side-stand-${side}-${row}`, side * sideCenter, height / 2, 0, 1.3, height, 116, material);
      box(`end-stand-${side}-${row}`, 0, height / 2, side * endCenter, 82, height, 1.3, material);
      const sideFront = side * (sideCenter - 0.65);
      const endFront = side * (endCenter - 0.65);
      mark([sideFront, height + 0.015, -57.9], [sideFront, height + 0.015, 57.9]);
      mark([-40.9, height + 0.015, endFront], [40.9, height + 0.015, endFront]);
      for (const aisle of [-30, 0, 30]) {
        mark([sideFront, height + 0.02, aisle], [side * (sideCenter + 0.65), height + 0.02, aisle]);
      }
      for (const aisle of [-23, 0, 23]) {
        mark([aisle, height + 0.02, endFront], [aisle, height + 0.02, side * (endCenter + 0.65)]);
      }
      populate('x', side, sideCenter, height, 56, 0);
      populate('z', side, endCenter, height, 39, 0);
    }
    box(`side-concourse-${side}`, side * 48.45, 5.5, 0, 1.2, 2.3, 118, concourse);
    box(`end-concourse-${side}`, 0, 5.5, side * 67.5, 84, 2.3, 1.2, concourse);
    box(`side-concourse-slab-${side}`, side * 48.3, 6.55, 0, 3.1, 0.34, 118, structure);
    box(`end-concourse-slab-${side}`, 0, 6.55, side * 67.3, 84, 0.34, 3.1, structure);
    for (let row = 0; row < 4; row++) {
      const height = 8.3 + row * 1.12;
      const sideCenter = 50.8 + row * 1.65;
      const endCenter = 69.8 + row * 1.65;
      box(`upper-side-stand-${side}-${row}`, side * sideCenter, height / 2 + 3.35, 0, 1.55, height - 6.7, 120, upperRows[row]!);
      box(`upper-end-stand-${side}-${row}`, 0, height / 2 + 3.35, side * endCenter, 86, height - 6.7, 1.55, upperRows[row]!);
      const sideFront = side * (sideCenter - 0.775);
      const endFront = side * (endCenter - 0.775);
      mark([sideFront, height + 0.02, -60], [sideFront, height + 0.02, 60]);
      mark([-43, height + 0.02, endFront], [43, height + 0.02, endFront]);
      for (const aisle of [-30, 0, 30]) mark([sideFront, height + 0.03, aisle], [side * (sideCenter + 0.775), height + 0.03, aisle]);
      for (const aisle of [-23, 0, 23]) mark([aisle, height + 0.03, endFront], [aisle, height + 0.03, side * (endCenter + 0.775)]);
      populate('x', side, sideCenter, height, 58, 1);
      populate('z', side, endCenter, height, 41, 1);
    }
    box(`side-back-wall-${side}`, side * 57.6, 8.4, 0, 1.6, 16.8, 122, structure);
    box(`end-back-wall-${side}`, 0, 8.4, side * 76.6, 88, 16.8, 1.6, structure);
    box(`side-roof-${side}`, side * 56, 17.3, 0, 4, 0.85, 134, roof);
    box(`end-roof-${side}`, 0, 17.3, side * 75.3, 106, 0.85, 4, roof);
    for (const aisle of [-30, 0, 30]) {
      box(`side-aisle-${side}-${aisle}`, side * 47.4, 4.9, aisle, 1.2, 0.08, 1.35, aisleMaterial);
    }
  }
  // Four shared corner batches bridge the straight stands and roof edges.
  // They keep the bowl enclosed without one mesh per spectator or corner.
  const corners = (name: string, width: number, height: number, depth: number, y: number, x: number, z: number, material: THREE.Material) => {
    const geometry = new THREE.BoxGeometry(width, height, depth);
    geometries.add(geometry);
    const batch = add(new THREE.InstancedMesh(geometry, material, 4), name);
    let index = 0;
    for (const xSide of [-1, 1]) for (const zSide of [-1, 1]) {
      crowdMatrix.makeTranslation(xSide * x, y, zSide * z);
      batch.setMatrixAt(index++, crowdMatrix);
    }
    batch.instanceMatrix.needsUpdate = true;
    batch.computeBoundingSphere();
  };
  corners('lower-corner-stands', 9, 5.2, 10, 2.6, 47.8, 62.4, standRows[3]!);
  corners('corner-concourse-bridges', 14, 1.7, 16, 5.9, 52, 68.5, concourse);
  corners('upper-corner-stands', 14, 10.175, 16, 11.7875, 52, 68.5, structure);
  corners('corner-roof-caps', 10, 0.85, 10, 17.3, 53, 71.5, roof);
  // Thin treads and nosings expose the stair profile from pitch level without
  // turning every seat into a separate draw call.
  const detail = (name: string, material: THREE.Material,
    transforms: Array<[number, number, number, number, number, number, number]>) => {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    geometries.add(geometry);
    const batch = add(new THREE.InstancedMesh(geometry, material, transforms.length), name);
    transforms.forEach(([x, y, z, w, h, d, rotation], index) => {
      crowdRotation.setFromAxisAngle(new THREE.Vector3(0, 1, 0), rotation);
      crowdMatrix.compose(new THREE.Vector3(x, y, z), crowdRotation, new THREE.Vector3(w, h, d));
      batch.setMatrixAt(index, crowdMatrix);
    });
    crowdRotation.identity();
    batch.instanceMatrix.needsUpdate = true;
    batch.computeBoundingSphere();
  };
  const treads: Array<[number, number, number, number, number, number, number]> = [];
  const upperCornerSteps: Array<[number, number, number, number, number, number, number]> = [];
  const trim: Array<[number, number, number, number, number, number, number]> = [];
  for (const side of [-1, 1]) {
    for (let row = 0; row < 5; row++) {
      treads.push([side * (40.25 + row * 1.48), 1.59 + row * 0.82, 0, 1.38, 0.09, 116, 0]);
      treads.push([0, 1.59 + row * 0.82, side * (59.3 + row * 1.48), 1.38, 0.09, 82, Math.PI / 2]);
    }
    for (let row = 0; row < 4; row++) {
      treads.push([side * (50.8 + row * 1.65), 8.34 + row * 1.12, 0, 1.55, 0.1, 120, 0]);
      treads.push([0, 8.34 + row * 1.12, side * (69.8 + row * 1.65), 1.55, 0.1, 86, Math.PI / 2]);
    }
    // A light roof deck has repeated soffit ribs and an inward-facing lip.
    for (const along of [-48, -24, 0, 24, 48]) trim.push([side * 53.2, 16.72, along, 6.8, 0.32, 0.25, 0]);
    for (const along of [-35, 0, 35]) trim.push([along, 16.72, side * 72.4, 6.8, 0.32, 0.25, Math.PI / 2]);
    trim.push([side * 54.15, 16.57, 0, 0.35, 1.42, 134, 0]);
    trim.push([0, 16.57, side * 73.45, 0.35, 1.42, 106, Math.PI / 2]);
    trim.push([side * 47.2, 6.9, 0, 0.14, 0.64, 117, 0]);
    trim.push([0, 6.9, side * 66.2, 0.14, 0.64, 83, Math.PI / 2]);
    trim.push([side * 38.55, 0.68, 0, 0.035, 0.13, 110, 0]);
    trim.push([0, 0.68, side * 57.15, 0.035, 0.13, 70, Math.PI / 2]);
  }
  // Diagonal treads carry the riser rhythm across each rectangular corner cap.
  for (const xSide of [-1, 1]) for (const zSide of [-1, 1]) {
    for (let row = 0; row < 4; row++) {
      treads.push([xSide * (44.1 + row * 1.35), 1.59 + row * 0.82,
        zSide * (58.5 + row * 1.4), 1.1, 0.09, 9.5, -xSide * zSide * Math.PI / 4]);
    }
    for (let row = 0; row < 7; row++) {
      const top = 8.3 + row * 1.12;
      const rise = top - 6.7;
      const x = xSide * (47.3 + row * 1.37);
      const z = zSide * (62.6 + row * 1.54);
      const rotation = -xSide * zSide * Math.PI / 4;
      upperCornerSteps.push([x, 6.7 + rise / 2, z, 1.55, rise, 14.2, rotation]);
      treads.push([x, top + 0.04, z, 1.62, 0.09, 14.2, rotation]);
    }
  }
  detail('upper-corner-seat-steps', upperRows[2]!, upperCornerSteps);
  detail('seat-tread-detail', standRows[2]!, treads);
  detail('concourse-and-roof-detail', structure, trim);
  for (const xSide of [-1, 1]) for (const zSide of [-1, 1]) {
    for (let tier = 0; tier < 2; tier++) for (let spectator = 0; spectator < 12; spectator++) {
      const size = 0.45 + random() * 0.22;
      crowdPosition.set(xSide * (45 + random() * (tier ? 9 : 5)), (tier ? 11.6 : 5.2) + size * 0.5, zSide * (59 + random() * (tier ? 13 : 6)));
      crowdScale.set(0.35, size, 0.27);
      crowdMatrix.compose(crowdPosition, crowdRotation, crowdScale);
      crowdMatrices[Math.floor(random() * crowdMatrices.length)]!.push(crowdMatrix.clone());
    }
  }
  const marksGeometry = new THREE.BufferGeometry();
  marksGeometry.setAttribute('position', new THREE.Float32BufferAttribute(standMarks, 3));
  geometries.add(marksGeometry);
  add(new THREE.LineSegments(marksGeometry, seatEdge), 'stand-row-edges-and-aisles');
  const crowdGeometry = new THREE.BoxGeometry(1, 1, 1);
  geometries.add(crowdGeometry);
  // The torso silhouettes stay in four static batches. Head detail is pooled
  // per colour and compacted by actual camera distance before each draw.
  const headGeometry = new THREE.PlaneGeometry(1, 1);
  geometries.add(headGeometry);
  const crowdColors = ['#4a718a', '#5c9085', '#a38b61', '#bbb5a2'];
  crowdMatrices.forEach((matrices, index) => {
    const material = basic(crowdColors[index]!);
    const batch = add(new THREE.InstancedMesh(crowdGeometry, material, matrices.length), `stadium-crowd-${index}`);
    const headCount = Math.min(12, matrices.length);
    const heads = add(new THREE.InstancedMesh(headGeometry,
      basic(['#a99578', '#b7a48b', '#887867', '#c1ad91'][index]!), headCount), `stadium-crowd-heads-${index}`);
    const headMatrices: THREE.Matrix4[] = [];
    matrices.forEach((matrix, instance) => batch.setMatrixAt(instance, matrix));
    for (let instance = 0; instance < headCount; instance++) {
      const matrix = matrices[Math.floor((instance + 0.5) * matrices.length / headCount)]!;
      matrix.decompose(crowdPosition, crowdRotation, crowdScale);
      crowdPosition.y += crowdScale.y * 0.56;
      const radius = crowdScale.x * 0.38;
      crowdScale.set(radius * 2, radius * 2.2, 1);
      if (Math.abs(crowdPosition.x) > 39) crowdRotation.setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2);
      crowdMatrix.compose(crowdPosition, crowdRotation, crowdScale);
      heads.setMatrixAt(instance, crowdMatrix);
      headMatrices.push(crowdMatrix.clone());
    }
    heads.frustumCulled = false;
    heads.onBeforeRender = (_renderer, _scene, camera) => {
      let visible = 0;
      for (const matrix of headMatrices) {
        crowdPosition.setFromMatrixPosition(matrix);
        if (crowdPosition.distanceToSquared(camera.position) > 68 * 68) continue;
        heads.setMatrixAt(visible++, matrix);
      }
      heads.count = visible;
      heads.instanceMatrix.needsUpdate = true;
    };
    batch.instanceMatrix.needsUpdate = true;
    heads.instanceMatrix.needsUpdate = true;
    batch.computeBoundingSphere();
    heads.computeBoundingSphere();
  });

  let disposed = false;
  return {
    root, background, fog,
    dispose() {
      if (disposed) return;
      disposed = true;
      for (const instance of instances) instance.dispose();
      for (const geometry of geometries) geometry.dispose();
      for (const material of materials) material.dispose();
      for (const texture of textures) texture.dispose();
      sun.shadow.dispose();
    },
  };
}

/** Attach a scene-owned presentation layer and restore the prior scene on cleanup. */
export function mountIncidentEnvironment(scene: THREE.Scene, environment: ReturnType<typeof createIncidentEnvironment>): () => void {
  const previousBackground = scene.background;
  const previousFog = scene.fog;
  scene.add(environment.root);
  scene.background = environment.background;
  scene.fog = environment.fog;
  return () => {
    scene.remove(environment.root);
    scene.background = previousBackground;
    scene.fog = previousFog;
    environment.dispose();
  };
}
