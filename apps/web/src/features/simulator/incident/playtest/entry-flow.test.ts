import { describe, expect, it } from 'vitest';
import { requestEntryCapabilities } from './entry-flow';

describe('requestEntryCapabilities', () => {
  it('requests pointer and fullscreen synchronously before awaiting either', async () => {
    const calls: string[] = [];
    let settlePointer!: () => void;
    const pointer = new Promise<void>((resolve) => { settlePointer = resolve; });
    const result = requestEntryCapabilities(
      () => { calls.push('pointer'); return pointer; },
      () => { calls.push('fullscreen'); },
    );
    expect(calls).toEqual(['pointer', 'fullscreen']);
    settlePointer();
    expect(await result).toEqual({ pointer: 'granted', fullscreen: 'granted' });
  });

  it('reports either denial while still requesting the other capability', async () => {
    const calls: string[] = [];
    const result = await requestEntryCapabilities(
      () => { calls.push('pointer'); throw new Error('blocked'); },
      () => { calls.push('fullscreen'); return Promise.reject(new Error('blocked')); },
    );
    expect(calls).toEqual(['pointer', 'fullscreen']);
    expect(result).toEqual({ pointer: 'denied', fullscreen: 'denied' });
  });
});
