export type Point = Readonly<{ x: number; y: number; z: number }>;
export type Box = Readonly<{ min: Point; max: Point }>;
export type Pose = Readonly<{ leftLegPitchRad: number; rightLegPitchRad: number;
  leftArmPitchRad: number; rightArmPitchRad: number; torsoPitchRad: number;
  leftFootLateralM?: number; leftFootForwardM?: number; leftFootLiftM?: number;
  rightFootForwardM?: number; rightFootLiftM?: number;
  leftKneeForwardM?: number; rightKneeForwardM?: number; rightKneeDropM?: number;
  handBraceLiftM?: number }>;
export type Segment = Readonly<{ start: Point; end: Point }>;
export type Joints = Readonly<Record<"hip" | "spine" | "neck" | "head" |
  "leftHip" | "leftKnee" | "leftAnkle" | "rightHip" | "rightKnee" | "rightAnkle" |
  "leftShoulder" | "leftElbow" | "leftWrist" | "rightShoulder" | "rightElbow" | "rightWrist", Point>>;
export type Segments = Readonly<Record<"torso" | "neck" | "leftThigh" | "leftShin" |
  "rightThigh" | "rightShin" | "leftUpperArm" | "leftForearm" |
  "rightUpperArm" | "rightForearm", Segment>>;
export declare const attachmentNames: readonly string[];
export declare const geometryPartNames: readonly string[];
export declare function samplePlayerGeometry(pose: Pose): Readonly<{
  pose: Pose;
  joints: Joints;
  segments: Segments;
  attachments: Readonly<Record<string, Point>>;
  parts: Readonly<Record<string, Box>>;
}>;
export declare function sampleAttachment(pose: Pose, name: string): Point | undefined;
export declare function sampleGeometryPart(pose: Pose, name: string): Box | undefined;
export declare function createPlayerGeometry(): unknown;
