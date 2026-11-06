import 'server-only';
import { readFileSync } from 'node:fs';
import { basename, resolve } from 'node:path';
import { compileCanonicalScenarioSourceV2 } from '@refview/content';
import { createIncident001GeometryResolverV2,
  createIncident001SourceV2 } from '../../../../../../packages/content/src/authored-incident-v2';

/** Authoring preview only. Training reads must use the reviewed PostgreSQL repository. */
export function loadIncident001Preview() {
  const source = createIncident001SourceV2();
  const assetRoot = basename(process.cwd()) === 'web'
    ? resolve(process.cwd(), '../../packages/content/assets')
    : resolve(process.cwd(), 'packages/content/assets');
  const byId = new Map(source.rendering.assets.map((asset) =>
    [asset.assetId, asset.neutralClientPath]));
  const compiled = compileCanonicalScenarioSourceV2(source, {
    ...createIncident001GeometryResolverV2(),
    resolveAssetBytes: (assetId, neutralClientPath) => {
      if (byId.get(assetId) !== neutralClientPath ||
        !/^\/assets\/asset-00[1-4]\.mjs$/.test(neutralClientPath)) return undefined;
      return readFileSync(resolve(assetRoot, basename(neutralClientPath)));
    },
  });
  return compiled.playable;
}
