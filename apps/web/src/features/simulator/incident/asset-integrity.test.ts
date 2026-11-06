import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { createIncident001SourceV2 } from '../../../../../../packages/content/src/authored-incident-v2';

describe('served authored incident assets', () => {
  it('serves the exact authored procedural source bytes at neutral public paths', () => {
    const source = createIncident001SourceV2();
    for (const asset of source.rendering.assets) {
      const filename = asset.neutralClientPath.split('/').at(-1)!;
      const served = readFileSync(new URL(`../../../../public/assets/${filename}`, import.meta.url));
      const authored = readFileSync(new URL(`../../../../../../packages/content/assets/${filename}`, import.meta.url));
      expect(served.equals(authored)).toBe(true);
      expect(`sha256:${createHash('sha256').update(served).digest('hex')}`).toBe(asset.sha256);
    }
  });
});
