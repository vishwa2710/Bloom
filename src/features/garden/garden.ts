import { GARDEN_CONFIG, MAX_STAGE } from '@/config';
import type { ReadingSummary } from '@/db/repo';
import { calendarDaysBetween } from '@/lib/time';

export interface GardenState {
  /** Stage earned purely from cumulative sessions (0..MAX_STAGE). */
  baseStage: number;
  /** Stage actually shown after withering is applied (0..baseStage). */
  effectiveStage: number;
  /** True once the garden has started drying out from inactivity. */
  isWithering: boolean;
  /** Calendar days since the last session (Infinity if never read). */
  daysSinceLast: number;
  /** Days of inactivity remaining before withering begins (0 if withering). */
  graceDaysLeft: number;
  currentStreakDays: number;
  totalSessions: number;
  /** Sessions still needed to reach the next stage, or null at full bloom. */
  sessionsToNextStage: number | null;
}

const STAGE_LABELS = ['Seed', 'Sprout', 'Bud', 'Blooming', 'Full bloom'] as const;

export function stageLabel(stage: number): string {
  return STAGE_LABELS[Math.min(stage, STAGE_LABELS.length - 1)] ?? 'Seed';
}

function baseStageForSessions(totalSessions: number): number {
  let stage = 0;
  for (let i = 0; i < GARDEN_CONFIG.stageThresholds.length; i++) {
    if (totalSessions >= GARDEN_CONFIG.stageThresholds[i]) stage = i;
  }
  return stage;
}

export function computeGardenState(summary: ReadingSummary, now = Date.now()): GardenState {
  const { totalSessions, lastSessionAt } = summary;

  const baseStage = baseStageForSessions(totalSessions);

  const daysSinceLast =
    lastSessionAt == null ? Infinity : Math.max(0, calendarDaysBetween(lastSessionAt, now));

  // Withering only applies to a garden that has actually grown.
  const witherSteps =
    totalSessions > 0 && daysSinceLast > GARDEN_CONFIG.witherAfterDays
      ? daysSinceLast - GARDEN_CONFIG.witherAfterDays
      : 0;

  const effectiveStage = Math.max(0, baseStage - witherSteps);
  const isWithering = witherSteps > 0;

  const graceDaysLeft = isWithering
    ? 0
    : totalSessions === 0
      ? GARDEN_CONFIG.witherAfterDays
      : Math.max(0, GARDEN_CONFIG.witherAfterDays - daysSinceLast);

  const nextThreshold =
    baseStage < MAX_STAGE ? GARDEN_CONFIG.stageThresholds[baseStage + 1] : null;
  const sessionsToNextStage = nextThreshold == null ? null : nextThreshold - totalSessions;

  return {
    baseStage,
    effectiveStage,
    isWithering,
    daysSinceLast,
    graceDaysLeft,
    currentStreakDays: summary.currentStreakDays,
    totalSessions,
    sessionsToNextStage,
  };
}
