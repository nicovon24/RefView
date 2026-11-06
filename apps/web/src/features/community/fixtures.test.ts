import { describe, expect, it } from 'vitest';
import { fictionalMatches, findFictionalMatch } from './fixtures';

describe('fictional match fixtures', () => {
  it('keeps unique stable identities across localized presentations', () => {
    expect(fictionalMatches.length).toBeGreaterThanOrEqual(2);
    expect(new Set(fictionalMatches.map(({ matchId }) => matchId)).size).toBe(fictionalMatches.length);
    for (const match of fictionalMatches) {
      expect(match.matchId).toMatch(/^[a-z0-9-]+$/);
      expect(match.homeTeam.es).not.toBe(match.awayTeam.es);
      expect(match.homeTeam.en).not.toBe(match.awayTeam.en);
      expect(match.competition.es).toBeTruthy();
      expect(match.competition.en).toBeTruthy();
      expect(match.description.es).toBeTruthy();
      expect(match.description.en).toBeTruthy();
      expect(match.decisionContext.es).toBeTruthy();
      expect(match.decisionContext.en).toBeTruthy();
      expect(match.refereeDecision.es).toBeTruthy();
      expect(match.refereeDecision.en).toBeTruthy();
      expect(match.version).toBe(2);
      expect(match.discussionPrompt.es).toBeTruthy();
      expect(match.discussionPrompt.en).toBeTruthy();
      expect(findFictionalMatch(match.matchId)).toBe(match);
    }
  });

  it('keeps the existing identities while giving each fictional decision a distinct rating target', () => {
    expect(fictionalMatches.map(({ matchId }) => matchId)).toEqual([
      'copa-del-faro-2025-04-12',
      'liga-de-la-brisa-2025-09-20',
    ]);
    expect(new Set(fictionalMatches.map(({ refereeDecision }) => refereeDecision.es)).size).toBe(fictionalMatches.length);
  });

  it('does not resolve an unknown match ID', () => {
    expect(findFictionalMatch('unknown-match')).toBeUndefined();
  });
});
