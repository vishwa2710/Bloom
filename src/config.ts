/**
 * Central tuning knobs for Bloom's prototype behaviour.
 *
 * Everything the garden and the session tracker key off of lives here so the
 * feel of the app can be tuned in one place without hunting through logic.
 */

export const GARDEN_CONFIG = {
  /**
   * Cumulative reading sessions required to *reach* each growth stage.
   * Index 0 is the seed (always reached). The last index is full bloom.
   */
  stageThresholds: [0, 1, 3, 7, 14] as const,

  /**
   * If the most recent session is older than this many days, the garden
   * begins to wither. Each additional day past the grace period knocks the
   * garden down one effective growth stage.
   */
  witherAfterDays: 3,
} as const;

export const SESSION_CONFIG = {
  /**
   * If the reader sees no page turn or interaction for this long, we stop
   * accruing "active reading" time — the user has probably walked away.
   *
   * Set generously (5 min) on purpose: a dense page can legitimately take
   * minutes to read, so a short timeout would under-count real reading. Any
   * page turn or tap resets it.
   */
  idleTimeoutMs: 5 * 60_000,

  /** How often the live session timer ticks (also the accrual granularity). */
  tickMs: 1_000,
} as const;

/** Number of growth stages, derived from the threshold table. */
export const MAX_STAGE = GARDEN_CONFIG.stageThresholds.length - 1;
