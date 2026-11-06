import { createHash } from "node:crypto";

export type AssetRecordV2 = Readonly<{
  assetId: string;
  kind: "proceduralModule" | "file";
  neutralClientPath: string;
  sha256: `sha256:${string}`;
  creator: string;
  origin: string;
  licenseId: string;
  licenseEvidence: string;
  attachmentNames: readonly string[];
  geometryPartNames: readonly string[];
}>;

const RECORD_KEYS = ["assetId", "kind", "neutralClientPath", "sha256", "creator", "origin",
  "licenseId", "licenseEvidence", "attachmentNames", "geometryPartNames"] as const;
const ASSET_ID = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;
const CLIENT_PATH = /^\/assets\/asset-[0-9]{3,}\.(?:bin|glb|gltf|js|json|mjs|mp3|ogg|png|wav|webp)$/;
const DIGEST = /^sha256:[0-9a-f]{64}$/;
const DECLARED_NAME = /^[A-Za-z][A-Za-z0-9_-]*$/;

function exactRecord(value: unknown): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError("asset record must be a plain object");
  }
  const prototype: unknown = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) {
    throw new TypeError("asset record must be a plain object");
  }
  const keys = Reflect.ownKeys(value);
  if (keys.length !== RECORD_KEYS.length || keys.some((key) => typeof key !== "string" || !RECORD_KEYS.includes(key as typeof RECORD_KEYS[number]))) {
    throw new TypeError("asset record has invalid fields");
  }
  for (const key of RECORD_KEYS) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!descriptor || !descriptor.enumerable || !("value" in descriptor)) {
      throw new TypeError(`asset record has invalid ${key}`);
    }
  }
  return value as Record<string, unknown>;
}

function exactArray(value: unknown, label: string): readonly unknown[] {
  if (!Array.isArray(value) || Object.getPrototypeOf(value) !== Array.prototype) {
    throw new TypeError(`${label} must be an array`);
  }
  const keys = Reflect.ownKeys(value);
  if (keys.length !== value.length + 1 || keys.some((key) =>
    key !== "length" && (typeof key !== "string" || !/^(0|[1-9][0-9]*)$/.test(key)))) {
    throw new TypeError(`${label} has invalid array fields`);
  }
  for (let index = 0; index < value.length; index++) {
    const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
    if (!descriptor || !descriptor.enumerable || !("value" in descriptor)) {
      throw new TypeError(`${label} must be dense plain data`);
    }
  }
  return value;
}

function requiredString(value: unknown, label: string, pattern?: RegExp): string {
  if (typeof value !== "string" || value.trim() !== value || value.length === 0 ||
      [...value].some((character) => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127) ||
      (pattern && !pattern.test(value))) {
    throw new TypeError(`invalid ${label}`);
  }
  return value;
}

function sortedNames(value: unknown, label: string): readonly string[] {
  const items = exactArray(value, label);
  const names = items.map((item) => requiredString(item, label, DECLARED_NAME));
  if (new Set(names).size !== names.length) throw new TypeError(`duplicate ${label}`);
  return Object.freeze(names.sort(compareCodeUnits));
}

function compareCodeUnits(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

export function verifyAssetRegistryV2(
  value: unknown,
  resolveAssetBytes: (assetId: string, neutralClientPath: string) => Uint8Array,
): readonly AssetRecordV2[] {
  if (typeof resolveAssetBytes !== "function") throw new TypeError("asset resolver is required");
  const items = exactArray(value, "asset registry");
  if (items.length === 0) throw new TypeError("asset registry is empty");
  const records = items.map((item): AssetRecordV2 => {
    const record = exactRecord(item);
    const kind = record.kind;
    if (kind !== "file" && kind !== "proceduralModule") throw new TypeError("invalid asset kind");
    return Object.freeze({
      assetId: requiredString(record.assetId, "asset ID", ASSET_ID),
      kind,
      neutralClientPath: requiredString(record.neutralClientPath, "client path", CLIENT_PATH),
      sha256: requiredString(record.sha256, "asset digest", DIGEST) as `sha256:${string}`,
      creator: requiredString(record.creator, "creator"),
      origin: requiredString(record.origin, "origin"),
      licenseId: requiredString(record.licenseId, "license ID"),
      licenseEvidence: requiredString(record.licenseEvidence, "license evidence"),
      attachmentNames: sortedNames(record.attachmentNames, "attachment names"),
      geometryPartNames: sortedNames(record.geometryPartNames, "geometry part names"),
    });
  });
  for (const key of ["assetId", "neutralClientPath", "sha256"] as const) {
    if (new Set(records.map((record) => record[key])).size !== records.length) {
      throw new TypeError(`duplicate ${key}`);
    }
  }
  for (const record of records) {
    const bytes: unknown = resolveAssetBytes(record.assetId, record.neutralClientPath);
    if (!(bytes instanceof Uint8Array)) throw new TypeError(`missing bytes for ${record.assetId}`);
    const actual = `sha256:${createHash("sha256").update(bytes).digest("hex")}`;
    if (actual !== record.sha256) throw new TypeError(`asset digest mismatch for ${record.assetId}`);
  }
  return Object.freeze(records.sort((a, b) => compareCodeUnits(a.assetId, b.assetId)));
}
