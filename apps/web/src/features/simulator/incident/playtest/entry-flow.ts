export type EntryPermission = 'granted' | 'denied';

/** Call both browser APIs during the same user activation, in this order. */
export async function requestEntryCapabilities(
  requestPointer: () => void | Promise<void>,
  requestFullscreen: () => void | Promise<void>,
): Promise<{ pointer: EntryPermission; fullscreen: EntryPermission }> {
  const attempt = (request: () => void | Promise<void>) => {
    try { return Promise.resolve(request()); }
    catch (error) { return Promise.reject(error); }
  };
  const pointer = attempt(requestPointer);
  const fullscreen = attempt(requestFullscreen);
  const [pointerResult, fullscreenResult] = await Promise.allSettled([pointer, fullscreen]);
  return {
    pointer: pointerResult.status === 'fulfilled' ? 'granted' : 'denied',
    fullscreen: fullscreenResult.status === 'fulfilled' ? 'granted' : 'denied',
  };
}
