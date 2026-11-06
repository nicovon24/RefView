// Original RefView procedural running presentation clip.
export function samplePose(phaseQ) {
  const stride = Math.sin(phaseQ * 0.22);
  const leftSwing = Math.max(0, -stride);
  const rightSwing = Math.max(0, stride);
  const smooth = (value) => value * value * (3 - 2 * value);
  // Blend to the reviewed pose through both evidence intervals, avoiding hard animation seams.
  const outside = (start, end) => phaseQ < start
    ? smooth(Math.max(0, Math.min(1, (start - phaseQ) / 12)))
    : phaseQ > end ? smooth(Math.max(0, Math.min(1, (phaseQ - end) / 12))) : 0;
  const refinement = Math.min(outside(116, 124), outside(330, 374));
  const mix = (original, improved) => original + (improved - original) * refinement;
  return {
    leftLegPitchRad: mix(stride * 0.38, stride * 0.45),
    rightLegPitchRad: mix(-stride * 0.38, -stride * 0.45),
    leftArmPitchRad: mix(-stride * 0.35, -stride * 0.5),
    rightArmPitchRad: mix(stride * 0.35, stride * 0.46),
    torsoPitchRad: 0,
    leftFootLateralM: 0,
    leftFootForwardM: mix(stride * 0.06, stride * 0.075),
    rightFootForwardM: mix(-stride * 0.12, -stride * 0.14),
    leftFootLiftM: mix(-0.16 + leftSwing * 0.14, -0.13 + leftSwing * 0.19),
    rightFootLiftM: mix(rightSwing * 0.15, rightSwing * 0.22),
    leftKneeForwardM: mix(rightSwing * 0.08, rightSwing * 0.115),
    rightKneeForwardM: mix(leftSwing * 0.08, leftSwing * 0.115),
  };
}
