/**
 * 🛡️ safeTap — unified anti-double-tap + haptic handler
 * Centralises interaction deduplication across all tappable elements.
 */

const lastTapMap = new Map<string, number>();
const DEFAULT_DEBOUNCE = 250;

export function safeTap(
  key: string,
  handler: () => void,
  debounceMs = DEFAULT_DEBOUNCE
): void {
  const now = Date.now();
  const last = lastTapMap.get(key) || 0;
  if (now - last < debounceMs) return;
  lastTapMap.set(key, now);
  handler();
}

/**
 * Schedule non-critical work after the browser is idle.
 * Falls back to setTimeout(fn, fallbackMs) on unsupported environments.
 */
export function scheduleIdle(fn: () => void, fallbackMs = 3000): number {
  if (typeof requestIdleCallback === 'function') {
    return requestIdleCallback(fn, { timeout: fallbackMs }) as unknown as number;
  }
  return window.setTimeout(fn, fallbackMs);
}

export function cancelIdle(id: number): void {
  if (typeof cancelIdleCallback === 'function') {
    cancelIdleCallback(id);
  } else {
    clearTimeout(id);
  }
}
