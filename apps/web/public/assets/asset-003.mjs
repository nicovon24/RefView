// Original RefView procedural motion clip; phase zero begins at its transition.
export function samplePose(phaseQ) {
  const t = Math.max(0, Math.min(1, phaseQ / 20));
  const fall = t * t * (3 - 2 * t);
  return {
    leftLegPitchRad: fall * 0.6,
    rightLegPitchRad: -fall * 0.4,
    leftArmPitchRad: 0.34374191541655813 * (1 - fall) - fall * 0.9,
    rightArmPitchRad: -0.34374191541655813 * (1 - fall) + fall * 0.95,
    torsoPitchRad: fall * 1.35,
    leftFootLateralM: 0,
    leftFootForwardM: 0,
    handBraceLiftM: fall * 0.28,
  };
}
