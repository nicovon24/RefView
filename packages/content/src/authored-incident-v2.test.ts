import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { compileCanonicalScenarioSourceV2 } from "./source-compiler-v2";
import { createIncident001GeometryResolverV2, createIncident001SourceV2 } from "./authored-incident-v2";

const assets = new Map([
  ["player-rig", "asset-001.mjs"], ["run-clip", "asset-002.mjs"],
  ["trip-clip", "asset-003.mjs"], ["challenge-clip", "asset-004.mjs"],
]);
const sha256Json = (value: unknown) => createHash("sha256")
  .update(JSON.stringify(value)).digest("hex");

describe("authored incident-001", () => {
  it("keeps served modules neutral and accepts a sampled pose", async () => {
    for (const filename of assets.values()) {
      const source = readFileSync(new URL(`../assets/${filename}`, import.meta.url), "utf8");
      expect(source).not.toMatch(/attack-\d|defence-\d|player-rig|run-clip|trip-clip|penalty|offence|ruling|contactFoot.*366/i);
    }
    const rig = await import(new URL("../assets/asset-001.mjs", import.meta.url).href);
    const run = await import(new URL("../assets/asset-002.mjs", import.meta.url).href);
    const pose = run.samplePose(120);
    expect(rig.samplePlayerGeometry(pose).pose).toEqual(pose);
    expect(rig.sampleAttachment(pose, "contactFoot"))
      .toEqual(rig.samplePlayerGeometry(pose).attachments.contactFoot);
  });

  it("opens with running outfield tracks while protecting the authored incident", () => {
    const source = createIncident001SourceV2();
    const samples = source.timeline.samples;
    const actorAt = (tick: number, id: string) => samples[tick]!.actors
      .find((actor) => actor.actorId === id)!;
    const velocity = (step: number, id: string) => {
      const start = actorAt(step, id).position;
      const end = actorAt(step + 1, id).position;
      return { x: 60 * (end.x - start.x), z: 60 * (end.z - start.z) };
    };

    for (const id of ["attack-08", "attack-09", "attack-10", "defence-02", "defence-04", "defence-05"]) {
      const first = velocity(0, id);
      expect(Math.hypot(first.x, first.z)).toBeGreaterThan(3.5);
      for (let step = 1; step < 270; step++) {
        const current = velocity(step, id);
        expect(current.x).toBeCloseTo(first.x, 10);
        expect(current.z).toBeCloseTo(first.z, 10);
      }
      for (let step = 270; step < 330; step++) {
        expect(velocity(step, id).z).toBeGreaterThanOrEqual(0);
      }
      expect(Math.hypot(velocity(269, id).x - velocity(270, id).x,
        velocity(269, id).z - velocity(270, id).z)).toBeLessThan(0.01);
      expect(Math.hypot(velocity(329, id).x - velocity(330, id).x,
        velocity(329, id).z - velocity(330, id).z)).toBeLessThan(0.01);
      expect(actorAt(120, id).position.z).toBeCloseTo(
        { 'attack-08': 29, 'attack-09': 30, 'attack-10': 27.3,
          'defence-02': 31.5, 'defence-04': 30.8, 'defence-05': 31.2 }[id]! - 10);
    }

    // The reviewed incident from tick 330 remains byte-for-byte unchanged.
    expect(sha256Json(samples.slice(330)))
      .toBe("4fdfd2379eaef6dddac26e931c8f5c8b7adf73de60b769c41262dc8ce26b277e");
    expect(sha256Json(samples.map((sample) => sample.actors
      .find((actor) => actor.actorId === "defence-01"))))
      .toBe("640afd8e8fe985d55f9e19db15aaead511e0bb95aedafc5447965a39a56923ea");
    for (const sample of samples.slice(0, 121)) {
      const passer = actorAt(sample.tick, "attack-08").position;
      const fraction = sample.tick / 120;
      const ease = fraction * fraction * (3 - 2 * fraction);
      expect(sample.ball.position.x - passer.x).toBeCloseTo(0, 10);
      expect(sample.ball.position.y - passer.y).toBeCloseTo(0.11, 10);
      expect(sample.ball.position.z - passer.z).toBeCloseTo(0.1 * (1 - ease), 10);
    }
    const receiverAt180 = actorAt(180, "attack-09").position;
    const ballAt180 = samples[180]!.ball.position;
    expect(Math.hypot(ballAt180.x - receiverAt180.x, ballAt180.z - receiverAt180.z))
      .toBeLessThan(0.5);
    const ballVelocity = (step: number) => {
      const start = samples[step]!.ball.position;
      const end = samples[step + 1]!.ball.position;
      return { x: 60 * (end.x - start.x), z: 60 * (end.z - start.z) };
    };
    for (const join of [180, 330]) {
      const before = ballVelocity(join - 1);
      const after = ballVelocity(join);
      expect(Math.hypot(before.x - after.x, before.z - after.z)).toBeLessThan(1);
    }
    expect(sha256Json(source.timeline.events))
      .toBe("4e5035fa8656b937aa40d2b95b296b7feef423edc57ce11ac6799cdafb54cc24");
    expect(sha256Json(source.facts))
      .toBe("f36429d0c154b11873ae886cd300bc9c23d4e7d30bfa3a102e5c32ba43ceb9df");
    expect(sha256Json(source.rubric))
      .toBe("adba3c45332f0b36aea25c5d9abd15d7f9fa3b0a1c1517f17b2a6f25159fc3d1");
    expect(sha256Json(source.officialSources))
      .toBe("f0a79245754d251a99680fcb1175bd691aa0e13ed940fb8c406536b74780995d");
    expect(source.initialRefereePose).toEqual({
      position: { x: 3, y: 0, z: 4 }, lookYaw: 0.8, lookPitch: 0,
    });
  });

  it("compiles real local asset bytes and 481 moving canonical ticks", async () => {
    const rig = await import(new URL("../assets/asset-001.mjs", import.meta.url).href) as {
      sampleAttachment: (pose: unknown, name: string) => { x: number; y: number; z: number } | undefined;
      sampleGeometryPart: (pose: unknown, name: string) => unknown;
      samplePlayerGeometry: (pose: unknown) => { attachments: Record<string, { x: number; y: number; z: number }>;
        parts: Record<string, unknown>; joints: Record<string, { x: number; y: number; z: number }> };
    };
    const clipA = await import(new URL("../assets/asset-002.mjs", import.meta.url).href) as
      { samplePose: (phase: number) => unknown };
    const clipB = await import(new URL("../assets/asset-003.mjs", import.meta.url).href) as
      { samplePose: (phase: number) => unknown };
    const clipC = await import(new URL("../assets/asset-004.mjs", import.meta.url).href) as
      { samplePose: (phase: number) => unknown };
    const poseFor = (clip: string, phase: number) =>
      clip === "run-clip" ? clipA.samplePose(phase) :
        clip === "trip-clip" ? clipB.samplePose(phase) : clipC.samplePose(phase);
    const source = createIncident001SourceV2();
    const result = compileCanonicalScenarioSourceV2(source, {
      resolveAssetBytes: (id, path) => {
        const filename = assets.get(id);
        if (!filename || path !== `/assets/${filename}`) return undefined;
        return readFileSync(new URL(`../assets/${filename}`, import.meta.url));
      },
      ...createIncident001GeometryResolverV2(),
    });
    expect(result.contentHash)
      .not.toBe("sha256:af3d339b32788db17d9b4fe1b7ce9aa880312fca57a26dd04ecde090f89edc76");
    expect(result.canonicalSource.timeline.samples).toHaveLength(481);
    const publicContactFrame = result.playable.actors[366]!.actors.find((actor) => actor.phaseQ === 0)!;
    const publicRigHandle = result.playable.actorRigBindings.find((binding) =>
      binding.actorHandle === publicContactFrame.actorHandle)!.rigAssetHandle;
    const publicClipPath = result.playable.assetManifest.find((entry) =>
      entry.assetHandle === publicContactFrame.clipHandle)!.neutralClientPath;
    const publicRigPath = result.playable.assetManifest.find((entry) =>
      entry.assetHandle === publicRigHandle)!.neutralClientPath;
    const publicClip = await import(new URL(`../assets/${publicClipPath.split("/").at(-1)}`, import.meta.url).href) as
      { samplePose: (phase: number) => unknown };
    const publicRig = await import(new URL(`../assets/${publicRigPath.split("/").at(-1)}`, import.meta.url).href) as
      { sampleAttachment: (pose: unknown, name: string) => { x: number; y: number; z: number } };
    const publicContact = publicRig.sampleAttachment(publicClip.samplePose(publicContactFrame.phaseQ), "contactFoot");
    expect({ x: publicContactFrame.position.x + publicContact.x,
      y: publicContactFrame.position.y + publicContact.y,
      z: publicContactFrame.position.z + publicContact.z })
      .toEqual({ x: 13.8, y: 0.34, z: 36.8 });
    const at = (tick: number, id: string) => result.canonicalSource.timeline.samples[tick]!.actors
      .find((actor) => actor.actorId === id)!.position;
    expect(at(120, "attack-09").z).toBeCloseTo(20);
    expect(at(120, "defence-02").z).toBeCloseTo(21.5);
    const secondLast = at(120, "defence-02").z;
    const defenderDepths = ["defence-01", "defence-02", "defence-04", "defence-05"]
      .map((id) => at(120, id).z).sort((a, b) => b - a);
    expect(secondLast).toBe(defenderDepths[1]);
    expect(secondLast - at(120, "attack-09").z).toBeCloseTo(source.facts.onsideMarginM, 10);
    const legalDepthsAtPass = (id: string) => {
      const actor = result.canonicalSource.timeline.samples[120]!.actors
        .find((item) => item.actorId === id)!;
      const joints = rig.samplePlayerGeometry(poseFor(actor.clipId, actor.phaseQ)).joints as
        Record<string, { z: number }>;
      return ["head", "spine", "leftAnkle", "rightAnkle"].map((name) =>
        actor.position.z + joints[name]!.z);
    };
    expect(Math.min(...legalDepthsAtPass("defence-02")) -
      Math.max(...legalDepthsAtPass("attack-09"))).toBeGreaterThan(1.3);
    const passEvidence = result.privateContext.observationFixture.evidence
      .find((item) => item.evidenceId === "EV-PASS-SNAPSHOT")!;
    expect(passEvidence.samples.find((item) => item.tick === 120)!.anchors
      .find((item) => item.anchorId === "secondLast")!.position.z).toBeCloseTo(secondLast);
    expect(source.geometryBindings.anchors.find((item) => item.evidenceId === "EV-PASS-SNAPSHOT" &&
      item.anchorId === "secondLast")!.target).toMatchObject({ actorId: "defence-02" });
    expect(at(120, "defence-05").z).toBeLessThan(secondLast);
    expect(at(300, "defence-05").z).toBeGreaterThan(at(120, "defence-05").z);
    expect(at(366, "defence-05").z).toBeGreaterThan(at(366, "attack-09").z);
    expect(at(366, "attack-09")).toEqual({ x: 13.8, y: 0, z: 36.8 });
    expect(at(366, "defence-05").z).toBeGreaterThan(40);
    expect(at(366, "attack-10").x).toBeLessThan(3);
    expect(at(0, "attack-09").z).toBeLessThan(at(120, "attack-09").z);
    expect(at(120, "attack-09").z).toBeLessThan(at(300, "attack-09").z);
    expect(at(300, "attack-09").z).toBeLessThan(at(366, "attack-09").z);
    expect(at(366, "attack-09").z - at(365, "attack-09").z).toBeGreaterThan(0.01);
    expect(at(367, "attack-09").z - at(366, "attack-09").z).toBeGreaterThan(0.01);
    expect(result.canonicalSource.timeline.samples[120]!.ball.position.x).toBeCloseTo(8);
    expect(result.canonicalSource.timeline.samples[120]!.ball.position.y).toBe(0.11);
    expect(result.canonicalSource.timeline.samples[120]!.ball.position.z).toBeCloseTo(19);
    expect(result.canonicalSource.timeline.samples[366]!.ball.position.z).toBeGreaterThan(37);
    const challenger = result.canonicalSource.timeline.samples[366]!.actors
      .find((actor) => actor.actorId === "defence-04")!;
    expect(challenger.clipId).toBe("challenge-clip");
    expect(challenger.phaseQ).toBe(10);
    const defenderFoot = rig.sampleAttachment(clipC.samplePose(challenger.phaseQ), "contactFoot")!;
    expect(Math.hypot(at(366, "defence-04").x - at(366, "attack-09").x,
      at(366, "defence-04").z - at(366, "attack-09").z)).toBeGreaterThan(0.7);
    expect(Math.hypot(at(366, "defence-04").x + defenderFoot.x - 13.8,
      at(366, "defence-04").z + defenderFoot.z - 36.8)).toBeLessThan(0.03);
    const attackerAtContact = result.canonicalSource.timeline.samples[366]!.actors
      .find((actor) => actor.actorId === "attack-09")!;
    const attackerBody = rig.samplePlayerGeometry(poseFor(attackerAtContact.clipId,
      attackerAtContact.phaseQ)).parts.body as { min: { x: number }; max: { x: number } };
    const defenderBody = rig.samplePlayerGeometry(poseFor(challenger.clipId,
      challenger.phaseQ)).parts.body as { min: { x: number }; max: { x: number } };
    expect(challenger.position.x + defenderBody.min.x).toBeGreaterThan(
      attackerAtContact.position.x + attackerBody.max.x);
    const ballAtContact = result.canonicalSource.timeline.samples[366]!.ball.position;
    const missDistance = Math.hypot(ballAtContact.x - at(366, "defence-04").x - defenderFoot.x,
      ballAtContact.z - at(366, "defence-04").z - defenderFoot.z);
    expect(missDistance).toBeGreaterThan(0.7);
    expect(missDistance).toBeLessThan(1);
    const contactToBallX = ballAtContact.x - 13.8;
    const contactToBallZ = ballAtContact.z - 36.8;
    const goodDistance = Math.hypot(13.8 - 6, 36.8 - 32);
    const lateralSeparation = Math.abs(
      contactToBallX * (-(36.8 - 32) / goodDistance) +
      contactToBallZ * ((13.8 - 6) / goodDistance));
    expect(lateralSeparation).toBeGreaterThan(0.8);
    const challengeX = defenderFoot.x;
    const challengeZ = defenderFoot.z;
    const ballX = ballAtContact.x - at(366, "defence-04").x;
    const ballZ = ballAtContact.z - at(366, "defence-04").z;
    expect((challengeX * ballX + challengeZ * ballZ) /
      (Math.hypot(challengeX, challengeZ) * Math.hypot(ballX, ballZ))).toBeGreaterThan(0.85);
    expect(result.canonicalSource.timeline.events.filter((event) => event.kind === "ballTouch"))
      .toEqual([{ eventId: "pass", tick: 120, ordinal: 0, kind: "ballTouch",
        actorIds: ["attack-08"], payload: {} }]);
    for (const asset of result.canonicalSource.rendering.assets) {
      const bytes = readFileSync(new URL(`../assets/${assets.get(asset.assetId)}`, import.meta.url));
      expect(asset.sha256).toBe(`sha256:${createHash("sha256").update(bytes).digest("hex")}`);
    }
    expect(result.requiredCaptureTicks).toEqual(expect.arrayContaining([120, 360, 366, 371, 480]));
    expect(result.privateContext.observationFixture.evidence.map((item) => item.evidenceId))
      .toEqual(expect.arrayContaining(["EV-TRIP-CONTACT", "EV-INSIDE-AREA"]));
    for (let tick = 1; tick <= 480; tick++) {
      for (const id of ["attack-09", "defence-05"]) {
        const previous = at(tick - 1, id);
        const current = at(tick, id);
        expect(Math.hypot(current.x - previous.x, current.z - previous.z)).toBeLessThan(0.12);
      }
    }
    const inside = result.privateContext.observationFixture.evidence
      .find((item) => item.evidenceId === "EV-INSIDE-AREA")!;
    const contactSample = inside.samples.find((item) => item.tick === 366)!;
    expect(contactSample.anchors.find((item) => item.anchorId === "ground")?.position)
      .toEqual({ x: 13.8, y: 0, z: 36.8 });
    expect(contactSample.anchors.find((item) => item.anchorId === "line")?.position)
      .toEqual({ x: 13.8, y: 0, z: 36 });
    const trip = result.privateContext.observationFixture.evidence
      .find((item) => item.evidenceId === "EV-TRIP-CONTACT")!;
    expect(trip.samples.find((item) => item.tick === 366)!.anchors
      .find((item) => item.anchorId === "contactFoot")!.position)
      .toEqual({ x: 13.8, y: 0.34, z: 36.8 });
    const feet = trip.samples.find((item) => item.tick === 366)!.anchors;
    const attackerFoot = feet.find((item) => item.anchorId === "contactFoot")!.position;
    const challengerFoot = feet.find((item) => item.anchorId === "challengerFoot")!.position;
    expect(Math.hypot(attackerFoot.x - challengerFoot.x, attackerFoot.y - challengerFoot.y,
      attackerFoot.z - challengerFoot.z)).toBeLessThanOrEqual(0.25);
    for (const tick of [360, 366, 371]) {
      const sample = inside.samples.find((item) => item.tick === tick)!;
      const screen = sample.occluders.find((item) => item.boxId === "screen")!;
      const defender = result.canonicalSource.timeline.samples[tick]!.actors
        .find((actor) => actor.actorId === "defence-02")!;
      const local = rig.samplePlayerGeometry(poseFor(defender.clipId, defender.phaseQ)).parts.body as
        { min: { x: number; y: number; z: number }; max: { x: number; y: number; z: number } };
      expect(screen.min.z).toBeCloseTo(defender.position.z + local.min.z);
      expect(screen.max.z).toBeCloseTo(defender.position.z + local.max.z);
    }
    const brokenDigest = createIncident001SourceV2();
    brokenDigest.rendering.assets[0]!.sha256 = `sha256:${"0".repeat(64)}`;
    expect(() => compileCanonicalScenarioSourceV2(brokenDigest, {
      resolveAssetBytes: (id) => readFileSync(new URL(`../assets/${assets.get(id)}`, import.meta.url)),
      ...createIncident001GeometryResolverV2(),
    })).toThrow(/digest|sha|mismatch/i);
    for (const [clip, phase] of [["run-clip", 120], ["run-clip", 360], ["trip-clip", 0],
      ["trip-clip", 5], ["trip-clip", 20], ["challenge-clip", 10]] as const) {
      const pose = poseFor(clip, phase);
      const visible = rig.samplePlayerGeometry(pose);
      for (const name of ["contactFoot", "ground", "head", "torso"]) {
        expect(rig.sampleAttachment(pose, name)).toEqual(visible.attachments[name]);
      }
      for (const name of ["body", "lowerLeg"]) {
        expect(rig.sampleGeometryPart(pose, name)).toEqual(visible.parts[name]);
      }
    }
    expect(rig.sampleAttachment(clipB.samplePose(0), "contactFoot"))
      .toEqual({ x: 0, y: 0.34, z: 0 });
    expect(rig.sampleAttachment(clipB.samplePose(20), "head")!.z).toBeGreaterThan(1.2);
    expect(rig.sampleAttachment(clipB.samplePose(20), "head")!.y)
      .toBeLessThan(0.4);
    expect(rig.sampleAttachment(clipB.samplePose(20), "torso")!.y).toBeLessThan(0.8);
    expect(rig.sampleAttachment(clipB.samplePose(20), "contactFoot")!.z).toBeGreaterThan(0.05);
    for (const [clip, phase] of [["run-clip", 360], ["trip-clip", 0], ["trip-clip", 5],
      ["trip-clip", 20]] as const) {
      const visible = rig.samplePlayerGeometry(poseFor(clip, phase));
      const head = visible.attachments.head!;
      const foot = visible.attachments.contactFoot!;
      const body = visible.parts.body as { min: { y: number; z: number }; max: { y: number; z: number } };
      const leg = visible.parts.lowerLeg as { min: { y: number; z: number }; max: { y: number; z: number } };
      expect(body.min.z).toBeLessThanOrEqual(head.z);
      expect(body.max.z).toBeGreaterThanOrEqual(head.z);
      expect(body.max.y).toBeGreaterThanOrEqual(head.y);
      expect(leg.min.z).toBeLessThanOrEqual(foot.z);
      expect(leg.max.z).toBeGreaterThanOrEqual(foot.z);
    }
    expect(result.privateContext.preparedDebrief.sections[0]!.es).toContain("área");
    expect(result.privateContext.preparedDebrief.sections[1]!.es).toContain("Había");
    expect(JSON.stringify(result.privateContext.preparedDebrief)).not.toContain("Ã");
  });
});
