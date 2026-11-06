import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({
  origin: 'http://127.0.0.1:3000' as string | null,
  saved: vi.fn(), unsaved: vi.fn(), refreshed: [] as string[],
}));

vi.mock('next/headers', () => ({
  headers: async () => ({ get: (name: string) => name === 'origin' ? state.origin : null }),
  cookies: async () => ({ get: () => undefined }),
}));
vi.mock('next/cache', () => ({ revalidatePath: (path: string) => state.refreshed.push(path) }));
vi.mock('@/lib/db/application-runtime', () => ({
  validateApplicationRuntime: () => ({ origin: 'http://127.0.0.1:3000' }),
  openApplicationDatabase: () => ({}),
}));
vi.mock('./saved-academy-service', () => ({
  saveAcademyLesson: state.saved, unsaveAcademyLesson: state.unsaved,
}));

import { saveSavedAcademyLesson, unsaveSavedAcademyLesson } from './saved-academy-actions';

beforeEach(() => {
  state.origin = 'http://127.0.0.1:3000';
  state.saved.mockReset().mockResolvedValue({ kind: 'saved' });
  state.unsaved.mockReset().mockResolvedValue({ kind: 'unsaved' });
  state.refreshed.length = 0;
});

describe('saved Academy Server Actions', () => {
  it.each([null, 'https://other.example', 'http://127.0.0.1:3000/'])(
    'rejects Origin %s before either mutation', async (origin) => {
      state.origin = origin;
      await expect(saveSavedAcademyLesson({ lessonId: 'lesson', version: 1 })).rejects.toThrow(/origin/i);
      await expect(unsaveSavedAcademyLesson({ lessonId: 'lesson', version: 1 })).rejects.toThrow(/origin/i);
      expect(state.saved).not.toHaveBeenCalled();
      expect(state.unsaved).not.toHaveBeenCalled();
    },
  );

  it.each([{}, { lessonId: 'lesson', version: 1, ownerId: 'foreign' },
    { lessonId: '../lesson', version: 1 }, { lessonId: 'lesson', version: 0 },
    { lessonId: 'lesson', version: '1' }])('rejects malformed identity %j', async (input) => {
    await expect(saveSavedAcademyLesson(input)).rejects.toThrow();
    await expect(unsaveSavedAcademyLesson(input)).rejects.toThrow();
    expect(state.saved).not.toHaveBeenCalled();
    expect(state.unsaved).not.toHaveBeenCalled();
  });

  it('passes only the identity to the service and refreshes both Profile locales after success', async () => {
    const ref = { lessonId: 'lesson', version: 2 };
    await expect(saveSavedAcademyLesson(ref)).resolves.toEqual({ kind: 'saved' });
    await expect(unsaveSavedAcademyLesson(ref)).resolves.toEqual({ kind: 'unsaved' });
    expect(state.saved.mock.calls[0][2]).toEqual(ref);
    expect(state.unsaved.mock.calls[0][2]).toEqual(ref);
    expect(state.refreshed).toEqual(['/es/profile', '/en/profile', '/es/profile', '/en/profile']);
  });

  it('does not refresh when the owner or content service rejects', async () => {
    state.saved.mockRejectedValueOnce(new Error('owner unavailable'));
    await expect(saveSavedAcademyLesson({ lessonId: 'lesson', version: 1 })).rejects.toThrow();
    expect(state.refreshed).toEqual([]);
  });
});
