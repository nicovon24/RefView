import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { verifyAssetRegistryV2 } from "./asset-registry-v2";

const bytes = new Uint8Array([1, 2, 3, 4]);
const digest = (value: Uint8Array) => `sha256:${createHash("sha256").update(value).digest("hex")}`;
const asset = (overrides: Record<string, unknown> = {}) => ({
  assetId: "rig-one", kind: "file", neutralClientPath: "/assets/asset-001.glb",
  sha256: digest(bytes), creator: "RefView", origin: "Original authored model",
  licenseId: "Proprietary", licenseEvidence: "asset-register/refview-001",
  attachmentNames: ["leftFoot", "rightFoot"], geometryPartNames: ["torso", "leftLeg"],
  ...overrides,
});
const resolve = () => bytes;

describe("verifyAssetRegistryV2", () => {
  it("verifies actual bytes and returns a detached, sorted, deeply frozen registry", () => {
    const otherBytes = new Uint8Array([9, 8]);
    const records = [
      asset({ assetId: "rig-two", neutralClientPath: "/assets/asset-002.glb", sha256: digest(otherBytes) }),
      asset({ attachmentNames: ["rightFoot", "leftFoot"], geometryPartNames: ["torso", "leftLeg"] }),
    ];
    const result = verifyAssetRegistryV2(records, (id, path) => {
      expect(path).toBe(id === "rig-one" ? "/assets/asset-001.glb" : "/assets/asset-002.glb");
      return id === "rig-one" ? bytes : otherBytes;
    });
    expect(result.map(({ assetId }) => assetId)).toEqual(["rig-one", "rig-two"]);
    expect(result[0]?.attachmentNames).toEqual(["leftFoot", "rightFoot"]);
    expect(verifyAssetRegistryV2([...records].reverse(), (id) => id === "rig-one" ? bytes : otherBytes)).toEqual(result);
    expect(result).not.toBe(records);
    expect(result[0]).not.toBe(records[1]);
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result[0])).toBe(true);
    expect(Object.isFrozen(result[0]?.attachmentNames)).toBe(true);
    records[1]!.creator = "mutated";
    records[1]!.attachmentNames[0] = "mutated";
    expect(result[0]?.creator).toBe("RefView");
    expect(result[0]?.attachmentNames).toEqual(["leftFoot", "rightFoot"]);
  });

  it("rejects byte mutation, missing bytes, and malformed digests", () => {
    expect(() => verifyAssetRegistryV2([asset()], () => new Uint8Array([1, 2, 3, 5]))).toThrow();
    expect(() => verifyAssetRegistryV2([asset()], (() => undefined) as unknown as typeof resolve)).toThrow();
    expect(() => verifyAssetRegistryV2([asset({ sha256: digest(bytes).toUpperCase() })], resolve)).toThrow();
  });

  it("rejects duplicate IDs, digests, paths, and declared names", () => {
    const alternate = asset({ assetId: "rig-two", neutralClientPath: "/assets/asset-002.glb" });
    expect(() => verifyAssetRegistryV2([asset(), asset()], resolve)).toThrow();
    expect(() => verifyAssetRegistryV2([asset(), alternate], resolve)).toThrow();
    expect(() => verifyAssetRegistryV2([asset(), asset({ assetId: "rig-two", sha256: digest(new Uint8Array([5])) })], resolve)).toThrow();
    expect(() => verifyAssetRegistryV2([asset({ attachmentNames: ["leftFoot", "leftFoot"] })], resolve)).toThrow();
    expect(() => verifyAssetRegistryV2([asset({ geometryPartNames: ["torso", "torso"] })], resolve)).toThrow();
  });

  it("rejects semantic and unsafe client paths", () => {
    for (const path of ["/assets/penalty-contact.glb", "/assets/asset-001-penalty.glb",
      "/assets/asset-001.glb?offence=trip", "/assets/../asset-001.glb", "https://example.test/assets/asset-001.glb",
      "/assets/asset-001.svg"]) {
      expect(() => verifyAssetRegistryV2([asset({ neutralClientPath: path })], resolve)).toThrow();
    }
  });

  it("accepts a neutral bundled procedural module path", () => {
    expect(verifyAssetRegistryV2([asset({ kind: "proceduralModule", neutralClientPath: "/assets/asset-001.mjs" })], resolve)[0]?.kind)
      .toBe("proceduralModule");
  });

  it("rejects unknown, hidden, symbol, inherited, accessor, and decorated inputs without invoking getters", () => {
    let getterCalls = 0;
    const withGetter = asset();
    Object.defineProperty(withGetter, "creator", { enumerable: true, get() { getterCalls++; return "bad"; } });
    expect(() => verifyAssetRegistryV2([withGetter], resolve)).toThrow();
    expect(getterCalls).toBe(0);
    const withHidden = asset();
    Object.defineProperty(withHidden, "hidden", { value: "secret" });
    expect(() => verifyAssetRegistryV2([withHidden], resolve)).toThrow();
    const withSymbol = asset();
    Object.defineProperty(withSymbol, Symbol("secret"), { value: "secret" });
    expect(() => verifyAssetRegistryV2([withSymbol], resolve)).toThrow();
    expect(() => verifyAssetRegistryV2([asset({ unexpected: true })], resolve)).toThrow();
    expect(() => verifyAssetRegistryV2([Object.assign(Object.create({ inherited: true }), asset())], resolve)).toThrow();
    const arrayWithProperty = [asset()];
    Object.defineProperty(arrayWithProperty, "metadata", { value: "secret" });
    expect(() => verifyAssetRegistryV2(arrayWithProperty, resolve)).toThrow();
    const sparse = new Array(1);
    expect(() => verifyAssetRegistryV2(sparse, resolve)).toThrow();
    const names = ["leftFoot"];
    Object.defineProperty(names, "metadata", { value: "secret" });
    expect(() => verifyAssetRegistryV2([asset({ attachmentNames: names })], resolve)).toThrow();
    const accessorNames = ["leftFoot"];
    Object.defineProperty(accessorNames, "0", { enumerable: true, get() { getterCalls++; return "leftFoot"; } });
    expect(() => verifyAssetRegistryV2([asset({ attachmentNames: accessorNames })], resolve)).toThrow();
    expect(getterCalls).toBe(0);
  });

  it("requires exact provenance strings and supported kinds", () => {
    for (const value of ["", "  ", "contains\nnewline", 42, null]) {
      expect(() => verifyAssetRegistryV2([asset({ licenseEvidence: value })], resolve)).toThrow();
    }
    expect(() => verifyAssetRegistryV2([asset({ kind: "remote" })], resolve)).toThrow();
  });
});
