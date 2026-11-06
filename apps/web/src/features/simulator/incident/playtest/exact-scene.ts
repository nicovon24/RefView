import * as THREE from "three";
import { reconstructViewpoints, type ObservationFixture } from "@refview/simulation";
import type { LocalRenderFrame } from "./live-controller";
import type { RiggedRefereeFrame } from "../../rigged-player/referee";

export const JOINT_NAMES = ["hip", "spine", "neck", "head", "leftHip", "leftKnee", "leftAnkle",
  "rightHip", "rightKnee", "rightAnkle", "leftShoulder", "leftElbow", "leftWrist",
  "rightShoulder", "rightElbow", "rightWrist"] as const;
export const SEGMENT_NAMES = ["torso", "neck", "leftThigh", "leftShin", "rightThigh", "rightShin",
  "leftUpperArm", "leftForearm", "rightUpperArm", "rightForearm"] as const;
type JointName = typeof JOINT_NAMES[number];
type SegmentName = typeof SEGMENT_NAMES[number];
type Point = Readonly<{ x: number; y: number; z: number }>;
type Segment = Readonly<{ start: Point; end: Point }>;
type RigGeometry = Readonly<{ joints: Record<JointName, Point>; segments: Record<SegmentName, Segment> }>;
type RigModule = Readonly<{ samplePlayerGeometry: (pose: unknown) => RigGeometry }>;
type ClipModule = Readonly<{ samplePose: (phaseQ: number) => unknown }>;
export type ActorSceneNodes = Readonly<{ root: THREE.Object3D;
  joints: Record<JointName, THREE.Object3D>; segments: Record<SegmentName, THREE.Object3D>;
  boots: Readonly<{ left: THREE.Object3D; right: THREE.Object3D }> }>;
export type RiggedVisualFrame = Readonly<{ tick: number; actorHandle: string; rootPosition: Point;
  yawRad: number; clipHandle: string; phaseQ: number }>;
/** Local visual candidate only: this adapter does not certify observation geometry. */
export type RiggedSceneActor = Readonly<{ kind: "rigged"; root: THREE.Object3D;
  applyFrame: (frame: RiggedVisualFrame) => unknown }>;
export type SceneActor = ActorSceneNodes | RiggedSceneActor;
export type RiggedRefereeScene = Readonly<{ kind: 'rigged-referee'; root: THREE.Object3D;
  applyFrame: (frame: RiggedRefereeFrame) => void }>;
function isRiggedActor(actor: SceneActor): actor is RiggedSceneActor {
  return "kind" in actor && actor.kind === "rigged";
}
function isRiggedReferee(referee: THREE.Object3D | RiggedRefereeScene): referee is RiggedRefereeScene {
  return 'kind' in referee && referee.kind === 'rigged-referee';
}
export type ExactSceneOptions = Readonly<{ scene: THREE.Scene; camera: THREE.PerspectiveCamera;
  gl: Readonly<{ domElement: { getBoundingClientRect: () => Readonly<{ width: number; height: number }> };
    getContext: () => Pick<WebGLRenderingContext, "isContextLost">;
    render: (scene: THREE.Scene, camera: THREE.PerspectiveCamera) => void }>;
  actors: ReadonlyMap<string, SceneActor>; ball: THREE.Object3D; referee: THREE.Object3D | RiggedRefereeScene;
  rigBindings: ReadonlyMap<string, string>; modules: ReadonlyMap<string, unknown> }>;

function finitePoint(value: Point | undefined, label: string): Point {
  if (!value || ![value.x, value.y, value.z].every(Number.isFinite))
    throw new RangeError(`invalid ${label}`);
  return value;
}
function requireNode(node: THREE.Object3D | undefined, label: string): THREE.Object3D {
  if (!node || !node.isObject3D) throw new Error(`missing scene node ${label}`);
  return node;
}
function requireDescendant(node: THREE.Object3D, ancestor: THREE.Object3D, label: string): void {
  for (let parent = node.parent; parent; parent = parent.parent) {
    if (parent === ancestor) return;
  }
  throw new Error(`scene node ${label} is detached from its root`);
}
function sampleRig(modules: ReadonlyMap<string, unknown>, rigHandle: string, clipHandle: string,
  phaseQ: number): RigGeometry {
  const rig = modules.get(rigHandle) as Partial<RigModule> | undefined;
  const clip = modules.get(clipHandle) as Partial<ClipModule> | undefined;
  if (typeof rig?.samplePlayerGeometry !== "function") throw new Error(`missing rig asset ${rigHandle}`);
  if (typeof clip?.samplePose !== "function") throw new Error(`missing clip asset ${clipHandle}`);
  if (!Number.isFinite(phaseQ)) throw new RangeError("invalid clip phase");
  const geometry = rig.samplePlayerGeometry(clip.samplePose(phaseQ));
  if (!geometry?.joints || !geometry.segments) throw new Error(`invalid rig geometry ${rigHandle}`);
  for (const name of JOINT_NAMES) finitePoint(geometry.joints[name], name);
  for (const name of SEGMENT_NAMES) {
    const segment = geometry.segments[name];
    finitePoint(segment?.start, `${name}.start`);
    finitePoint(segment?.end, `${name}.end`);
    if (Math.hypot(segment.end.x - segment.start.x, segment.end.y - segment.start.y,
      segment.end.z - segment.start.z) < 0.001) throw new RangeError(`degenerate segment ${name}`);
  }
  return geometry;
}
function placePoint(node: THREE.Object3D, point: Point): void {
  node.position.set(point.x, point.y, point.z);
}
const up = new THREE.Vector3(0, 1, 0);
function placeSegment(node: THREE.Object3D, segment: Segment): void {
  const start = new THREE.Vector3(segment.start.x, segment.start.y, segment.start.z);
  const end = new THREE.Vector3(segment.end.x, segment.end.y, segment.end.z);
  const direction = end.sub(start);
  node.position.copy(start.addScaledVector(direction, 0.5));
  node.quaternion.setFromUnitVectors(up, direction.clone().normalize());
  node.scale.y = direction.length();
}

export function applyPlayerPose(nodes: ActorSceneNodes, position: Point, yawRad: number,
  geometry: RigGeometry): void {
  placePoint(nodes.root, position);
  nodes.root.rotation.set(0, yawRad, 0);
  for (const name of JOINT_NAMES) placePoint(nodes.joints[name], geometry.joints[name]);
  for (const name of SEGMENT_NAMES) placeSegment(nodes.segments[name], geometry.segments[name]);
  placePoint(nodes.boots.left, geometry.joints.leftAnkle);
  placePoint(nodes.boots.right, geometry.joints.rightAnkle);
}

/** Apply and submit one public canonical tick inside LocalIncidentController.frame's callback. */
export function createExactSceneRenderer(options: ExactSceneOptions): (frame: LocalRenderFrame) => void {
  return (frame) => {
    if (frame.tick !== frame.world.tick || frame.tick !== frame.view.tick ||
      frame.tick !== frame.refereeMotion.tick)
      throw new Error("render frame tick mismatch");
    if (options.gl.getContext().isContextLost()) throw new Error("WebGL context lost");
    const rect = options.gl.domElement.getBoundingClientRect();
    const aspect = rect.width / rect.height;
    if (!Number.isFinite(aspect) || Math.abs(aspect - frame.view.viewportAspectRatio) > 1e-6)
      throw new Error("canvas aspect differs from ViewSample aspect");
    const fixture: ObservationFixture = { ref: frame.world.ref,
      scenarioContentHash: "public-render-only", durationTicks: 480,
      visibilityModelVersion: 1, cameraRigVersion: 1, eyeCalibrationVersion: 1,
      cameraColliders: [], evidence: [] };
    const viewpoint = reconstructViewpoints(fixture, frame.view).camera;
    const actorPlans = frame.world.actors.map((actor) => {
      const nodes = options.actors.get(actor.actorId);
      if (!nodes) throw new Error(`missing actor node ${actor.actorId}`);
      requireNode(nodes.root, `${actor.actorId}.root`);
      requireDescendant(nodes.root, options.scene, `${actor.actorId}.root`);
      finitePoint(actor.position, `${actor.actorId}.position`);
      if (!Number.isFinite(actor.yawRad)) throw new RangeError("invalid actor yaw");
      if (!Number.isFinite(actor.phaseQ)) throw new RangeError("invalid clip phase");
      if (isRiggedActor(nodes)) return { actor, nodes, geometry: undefined };
      const rigHandle = options.rigBindings.get(actor.actorId);
      if (!rigHandle) throw new Error(`missing rig binding ${actor.actorId}`);
      const geometry = sampleRig(options.modules, rigHandle, actor.clipId, actor.phaseQ);
      for (const name of JOINT_NAMES) {
        requireDescendant(requireNode(nodes.joints[name], `${actor.actorId}.${name}`), nodes.root,
          `${actor.actorId}.${name}`);
      }
      for (const name of SEGMENT_NAMES) {
        requireDescendant(requireNode(nodes.segments[name], `${actor.actorId}.${name}`), nodes.root,
          `${actor.actorId}.${name}`);
      }
      requireDescendant(requireNode(nodes.boots.left, `${actor.actorId}.leftBoot`), nodes.root,
        `${actor.actorId}.leftBoot`);
      requireDescendant(requireNode(nodes.boots.right, `${actor.actorId}.rightBoot`), nodes.root,
        `${actor.actorId}.rightBoot`);
      return { actor, nodes, geometry };
    });
    if (actorPlans.length !== options.actors.size || new Set(actorPlans.map((p) => p.actor.actorId)).size !== actorPlans.length)
      throw new Error("actor roster differs from scene nodes");
    requireDescendant(requireNode(options.ball, "ball"), options.scene, "ball");
    const refereeRoot = isRiggedReferee(options.referee) ? options.referee.root : options.referee;
    requireDescendant(requireNode(refereeRoot, "referee"), options.scene, "referee");
    finitePoint(frame.world.ball.position, "ball.position");
    const q = frame.world.ball.orientation;
    if (![q.qx, q.qy, q.qz, q.qw].every(Number.isFinite) ||
      Math.abs(q.qx * q.qx + q.qy * q.qy + q.qz * q.qz + q.qw * q.qw - 1) > 1e-4)
      throw new RangeError("invalid ball quaternion");

    for (const { actor, nodes, geometry } of actorPlans) {
      if (isRiggedActor(nodes)) {
        nodes.applyFrame({ tick: frame.tick, actorHandle: actor.actorId,
          rootPosition: actor.position, yawRad: actor.yawRad, clipHandle: actor.clipId, phaseQ: actor.phaseQ });
        const expectedRotation = new THREE.Quaternion().setFromAxisAngle(up, actor.yawRad);
        if (nodes.root.position.x !== actor.position.x || nodes.root.position.y !== actor.position.y ||
          nodes.root.position.z !== actor.position.z ||
          !Number.isFinite(nodes.root.quaternion.lengthSq()) ||
          Math.abs(nodes.root.quaternion.lengthSq() - 1) > 1e-6 ||
          nodes.root.quaternion.angleTo(expectedRotation) > 1e-6 ||
          nodes.root.scale.x !== 1 || nodes.root.scale.y !== 1 || nodes.root.scale.z !== 1) {
          throw new Error("rigged presentation changed canonical root");
        }
      } else {
        applyPlayerPose(nodes, actor.position, actor.yawRad, geometry!);
      }
    }
    placePoint(options.ball, frame.world.ball.position);
    options.ball.quaternion.set(q.qx, q.qy, q.qz, q.qw);
    if (isRiggedReferee(options.referee)) {
      options.referee.applyFrame({ tick: frame.tick, position: frame.view.refereePosition,
        lookYaw: frame.view.lookYaw, cameraMode: frame.view.cameraMode, elevatedReview: false,
        motion: frame.refereeMotion });
      const expectedRotation = new THREE.Quaternion().setFromAxisAngle(up, frame.view.lookYaw);
      if (refereeRoot.position.x !== frame.view.refereePosition.x ||
        refereeRoot.position.y !== frame.view.refereePosition.y ||
        refereeRoot.position.z !== frame.view.refereePosition.z ||
        !Number.isFinite(refereeRoot.quaternion.lengthSq()) ||
        Math.abs(refereeRoot.quaternion.lengthSq() - 1) > 1e-6 ||
        refereeRoot.quaternion.angleTo(expectedRotation) > 1e-6 ||
        refereeRoot.scale.x !== 1 || refereeRoot.scale.y !== 1 || refereeRoot.scale.z !== 1 ||
        refereeRoot.visible !== (frame.view.cameraMode === 'thirdPerson')) {
        throw new Error('rigged referee changed canonical root or visibility');
      }
    } else {
      placePoint(options.referee, frame.view.refereePosition);
      options.referee.rotation.set(0, frame.view.lookYaw, 0);
      options.referee.visible = frame.view.cameraMode === "thirdPerson";
    }
    placePoint(options.camera, viewpoint.position);
    options.camera.up.set(0, 1, 0);
    options.camera.lookAt(viewpoint.position.x + viewpoint.forward.x,
      viewpoint.position.y + viewpoint.forward.y,
      viewpoint.position.z + viewpoint.forward.z);
    options.camera.aspect = aspect;
    options.camera.fov = frame.view.verticalFovRad * 180 / Math.PI;
    options.camera.updateProjectionMatrix();
    if (options.gl.getContext().isContextLost()) throw new Error("WebGL context lost");
    options.gl.render(options.scene, options.camera);
    if (options.gl.getContext().isContextLost()) throw new Error("WebGL context lost");
  };
}
