import { describe, expect, it } from 'vitest';
import { fictionalMatches } from './fixtures';
import { compileFictionalCommunityFixtureV1 } from './fixture-source-v1';

const fixture = () => structuredClone(fictionalMatches[0]);

describe('fictional Community fixture compiler', () => {
  it('compiles the complete version 2 bilingual source into a frozen deterministic hash', () => {
    const source = fixture();
    const result = compileFictionalCommunityFixtureV1(source);
    expect(result.fixture).toEqual(source);
    expect(result.contentHash).toMatch(/^sha256:[0-9a-f]{64}$/);
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.fixture)).toBe(true);
    expect(Object.isFrozen(result.fixture.description)).toBe(true);
    expect(() => Object.assign(result, { contentHash: 'sha256:changed', fixture: fixture() })).toThrow();
    source.description.es = 'Changed after compilation';
    expect(result.fixture.description.es).not.toBe(source.description.es);
    expect(compileFictionalCommunityFixtureV1({ ...fixture(), author: fixture().author }).contentHash)
      .toBe(result.contentHash);
    expect(compileFictionalCommunityFixtureV1({ ...fixture(), refereeDecision: {
      ...fixture().refereeDecision, en: 'A different fictional decision.',
    } }).contentHash).not.toBe(result.contentHash);
  });

  it('pins both current repository-authored fixture payloads', () => {
    expect(fictionalMatches.map((source) => [source.matchId,
      compileFictionalCommunityFixtureV1(source).contentHash])).toEqual([
      ['copa-del-faro-2025-04-12', 'sha256:8cc07f853210fb05656fc03c2307e93af6433b5646cc6c035dfccee43cc87a38'],
      ['liga-de-la-brisa-2025-09-20', 'sha256:553913d6997c756c3f7491dd9d535a60bba15ae76b11a31a66c628a7ae1e24f7'],
    ]);
  });

  it('rejects omitted, additional, malformed, and unbounded source fields', () => {
    const { provenance, ...withoutProvenance } = fixture();
    expect(provenance).toBeTruthy();
    expect(() => compileFictionalCommunityFixtureV1(withoutProvenance)).toThrow();
    expect(() => compileFictionalCommunityFixtureV1({ ...fixture(), hidden: 'unreviewed' })).toThrow();
    expect(() => compileFictionalCommunityFixtureV1({ ...fixture(), competition: {
      ...fixture().competition, fr: 'Unreviewed',
    } })).toThrow();
    expect(() => compileFictionalCommunityFixtureV1({ ...fixture(), decisionContext: {
      ...fixture().decisionContext, en: 'x'.repeat(4097),
    } })).toThrow();
    expect(() => compileFictionalCommunityFixtureV1({ ...fixture(), discussionPrompt: {
      ...fixture().discussionPrompt, es: '  ',
    } })).toThrow();
    expect(() => compileFictionalCommunityFixtureV1({ ...fixture(), refereeDecision: {
      ...fixture().refereeDecision, es: '<script>alert(1)</script>',
    } })).toThrow();
  });

  it('rejects changed stable identity, version, and indistinguishable teams', () => {
    expect(() => compileFictionalCommunityFixtureV1({ ...fixture(), matchId: 'unknown-match' })).toThrow();
    expect(() => compileFictionalCommunityFixtureV1({ ...fixture(), date: '2025-04-13' })).toThrow();
    expect(() => compileFictionalCommunityFixtureV1({ ...fixture(), version: 1 })).toThrow();
    expect(() => compileFictionalCommunityFixtureV1({ ...fixture(), awayTeam: fixture().homeTeam })).toThrow();
  });

  it('binds every authored identity, copy, and provenance field to the payload hash', () => {
    const original = fixture();
    const originalHash = compileFictionalCommunityFixtureV1(original).contentHash;
    for (const field of ['competition', 'homeTeam', 'awayTeam', 'description', 'decisionContext',
      'refereeDecision', 'discussionPrompt'] as const) {
      const changed = { ...original, [field]: { ...original[field], en: `${original[field].en} More text.` } };
      expect(compileFictionalCommunityFixtureV1(changed).contentHash).not.toBe(originalHash);
    }
    expect(() => compileFictionalCommunityFixtureV1({ ...original, author: 'Another author' })).toThrow();
    expect(() => compileFictionalCommunityFixtureV1({ ...original, provenance: 'Unknown source' })).toThrow();
  });
});
