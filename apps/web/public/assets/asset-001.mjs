// Original RefView procedural footballer rig. Units are metres; +z is forward.

export const attachmentNames = Object.freeze(["contactFoot", "ground", "head", "torso"]);
export const geometryPartNames = Object.freeze(["body", "lowerLeg"]);

const point = (x, y, z) => ({ x, y, z });
const segment = (start, end) => ({ start, end });
const bounds = (points, padding) => ({
  min: point(Math.min(...points.map((p) => p.x)) - padding,
    Math.min(...points.map((p) => p.y)) - padding,
    Math.min(...points.map((p) => p.z)) - padding),
  max: point(Math.max(...points.map((p) => p.x)) + padding,
    Math.max(...points.map((p) => p.y)) + padding,
    Math.max(...points.map((p) => p.z)) + padding),
});

export function samplePlayerGeometry(pose) {
  const lean = pose.torsoPitchRad;
  const fall = Math.max(0, Math.min(1, lean / 1.35));
  const hip = point(0, 0.75 - fall * 0.63, 0);
  const axisY = Math.cos(lean);
  const axisZ = Math.sin(lean);
  const spine = point(0, hip.y + axisY * (0.47 + fall * 0.08), axisZ * (0.47 + fall * 0.08));
  const neck = point(0, hip.y + axisY * (0.82 + fall * 0.24), axisZ * (0.82 + fall * 0.24));
  const head = point(0, hip.y + axisY * (0.97 + fall * 0.29), axisZ * (0.97 + fall * 0.29));
  const leftHip = point(-0.13, hip.y, hip.z);
  const rightHip = point(0.13, hip.y, hip.z);
  const leftAnkle = point(pose.leftFootLateralM ?? 0,
    0.34 - fall * 0.13 + (pose.leftFootLiftM ?? 0), Math.sin(pose.leftLegPitchRad) * 0.18 +
      (pose.leftFootForwardM ?? 0) + fall * 0.2);
  const rightAnkle = point(0.13, 0.11 + fall * 0.08 + (pose.rightFootLiftM ?? 0),
    -Math.sin(pose.rightLegPitchRad) * 0.16 + (pose.rightFootForwardM ?? 0) + fall * 0.08);
  const leftKnee = point((leftHip.x + leftAnkle.x) / 2,
    Math.max(leftHip.y, leftAnkle.y) * 0.58 + Math.min(leftHip.y, leftAnkle.y) * 0.42,
    (leftHip.z + leftAnkle.z) / 2 + 0.05 + (pose.leftKneeForwardM ?? 0));
  const rightKnee = point((rightHip.x + rightAnkle.x) / 2,
    Math.max(rightHip.y, rightAnkle.y) * 0.58 + Math.min(rightHip.y, rightAnkle.y) * 0.42 -
      (pose.rightKneeDropM ?? 0),
    (rightHip.z + rightAnkle.z) / 2 + 0.04 + (pose.rightKneeForwardM ?? 0));
  const leftShoulder = point(-0.24, neck.y - axisY * 0.13, neck.z - axisZ * 0.13);
  const rightShoulder = point(0.24, neck.y - axisY * 0.13, neck.z - axisZ * 0.13);
  const leftWrist = point(-0.32, leftShoulder.y - 0.54 * Math.cos(pose.leftArmPitchRad) +
    (pose.handBraceLiftM ?? 0),
    leftShoulder.z + 0.54 * Math.sin(pose.leftArmPitchRad));
  const rightWrist = point(0.32, rightShoulder.y - 0.54 * Math.cos(pose.rightArmPitchRad) +
    (pose.handBraceLiftM ?? 0),
    rightShoulder.z + 0.54 * Math.sin(pose.rightArmPitchRad));
  const leftElbow = point((leftShoulder.x + leftWrist.x) / 2 - 0.03,
    (leftShoulder.y + leftWrist.y) / 2, (leftShoulder.z + leftWrist.z) / 2);
  const rightElbow = point((rightShoulder.x + rightWrist.x) / 2 + 0.03,
    (rightShoulder.y + rightWrist.y) / 2, (rightShoulder.z + rightWrist.z) / 2);
  const joints = { hip, spine, neck, head, leftHip, leftKnee, leftAnkle,
    rightHip, rightKnee, rightAnkle, leftShoulder, leftElbow, leftWrist,
    rightShoulder, rightElbow, rightWrist };
  const segments = {
    torso: segment(hip, spine), neck: segment(spine, neck),
    leftThigh: segment(leftHip, leftKnee), leftShin: segment(leftKnee, leftAnkle),
    rightThigh: segment(rightHip, rightKnee), rightShin: segment(rightKnee, rightAnkle),
    leftUpperArm: segment(leftShoulder, leftElbow), leftForearm: segment(leftElbow, leftWrist),
    rightUpperArm: segment(rightShoulder, rightElbow), rightForearm: segment(rightElbow, rightWrist),
  };
  const attachments = { contactFoot: leftAnkle, ground: point(0, 0, 0), head, torso: spine };
  const parts = {
    body: bounds([hip, spine, neck, head, leftShoulder, rightShoulder], 0.13),
    lowerLeg: bounds([leftHip, leftKnee, leftAnkle, rightHip, rightKnee, rightAnkle], 0.09),
  };
  return { pose, joints, segments, attachments, parts };
}

export function sampleAttachment(pose, name) {
  return samplePlayerGeometry(pose).attachments[name];
}

export function sampleGeometryPart(pose, name) {
  return samplePlayerGeometry(pose).parts[name];
}

export function createPlayerGeometry() {
  return Object.freeze({
    torso: { shape: "capsule", radiusM: 0.24, lengthM: 0.62, centerY: 1.15 },
    head: { shape: "sphere", radiusM: 0.12, centerY: 1.72 },
    limbs: { shape: "capsule", legRadiusM: 0.09, armRadiusM: 0.07 },
    attachments: attachmentNames, geometryParts: geometryPartNames,
    samplePlayerGeometry,
  });
}
