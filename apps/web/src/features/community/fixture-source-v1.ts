import { createHash } from 'node:crypto';
import { canonicalJsonV2 } from '@refview/content';
import { z } from 'zod';

const boundedText = (max: number) => z.string().min(1).max(max).refine((value) =>
  value === value.trim() && !/[<>\u0000-\u001f\u007f]/u.test(value));
const localized = (max: number) => z.strictObject({ es: boundedText(max), en: boundedText(max) });
const fixtureSchema = z.strictObject({
  matchId: z.enum(['copa-del-faro-2025-04-12', 'liga-de-la-brisa-2025-09-20']),
  version: z.literal(2),
  date: z.iso.date(),
  competition: localized(120),
  homeTeam: localized(120),
  awayTeam: localized(120),
  description: localized(4096),
  discussionPrompt: localized(4096),
  decisionContext: localized(4096),
  refereeDecision: localized(4096),
  author: z.literal('RefView'),
  provenance: z.literal('Original repository-authored text; no external media or assets.'),
});

export type FictionalCommunityFixtureV1 = Readonly<z.infer<typeof fixtureSchema>>;

function freezeDeep<T>(value: T): T {
  if (value !== null && typeof value === 'object') {
    for (const child of Object.values(value)) freezeDeep(child);
    Object.freeze(value);
  }
  return value;
}

export function compileFictionalCommunityFixtureV1(input: unknown): {
  readonly fixture: FictionalCommunityFixtureV1;
  readonly contentHash: `sha256:${string}`;
} {
  // Canonicalization rejects non-JSON values, accessors, sparse arrays, and decorated objects.
  const fixture = fixtureSchema.parse(JSON.parse(canonicalJsonV2(input)));
  if (fixture.matchId !== `${fixture.matchId.slice(0, -10)}${fixture.date}`) {
    throw new Error('fixture identity/date mismatch');
  }
  for (const locale of ['es', 'en'] as const) {
    if (fixture.homeTeam[locale] === fixture.awayTeam[locale]) {
      throw new Error('fixture teams must differ');
    }
  }
  const contentHash = `sha256:${createHash('sha256')
    .update(canonicalJsonV2(['refview-fictional-community-fixture-v1', fixture]), 'utf8')
    .digest('hex')}` as const;
  return Object.freeze({ fixture: freezeDeep(fixture), contentHash });
}
