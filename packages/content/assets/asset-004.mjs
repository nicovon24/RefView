// Original RefView procedural challenge clip; phase ten is maximum boot reach.
export function samplePose(phaseQ) {
  const t = Math.max(0, Math.min(1, phaseQ <= 10 ? phaseQ / 10 : (20 - phaseQ) / 10));
  const reach = t * t * (3 - 2 * t);
  return {
    leftLegPitchRad: 0,
    rightLegPitchRad: 0,
    leftArmPitchRad: -0.14902065183666718 * (1 - reach) - reach * 0.56,
    rightArmPitchRad: 0.14902065183666718 * (1 - reach) + reach * 0.56,
    torsoPitchRad: phaseQ > 15 && phaseQ < 20 ? Math.sin(Math.PI * (phaseQ - 15) / 5) * 0.11 : 0,
    leftFootLateralM: -reach * 0.75,
    leftFootForwardM: reach * 0.9,
    leftKneeForwardM: reach * 0.18,
    rightKneeDropM: reach * 0.09,
    rightKneeForwardM: reach * 0.06,
  };
}
