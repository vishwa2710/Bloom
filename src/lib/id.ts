/**
 * Lightweight unique id. Good enough for local-only rows; swap for a real
 * UUID lib if/when rows sync to a backend.
 */
export function createId(prefix = 'id'): string {
  const rand = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${Date.now().toString(36)}_${rand}`;
}
