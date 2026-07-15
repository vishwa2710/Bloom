import { StyleSheet, Text, View } from 'react-native';

import { type GardenState, stageLabel } from '@/features/garden/garden';
import { colors, radius, spacing } from '@/theme';

/**
 * Placeholder garden visual for the prototype: a staged emoji on a coloured
 * disc. This is intentionally simple art — the growth *logic* is what we're
 * proving here. Phase 2+ swaps this for illustrated / Skia-animated stages.
 */
const HEALTHY_STAGES = ['🌱', '🌿', '🌷', '🌸', '🌳'] as const;
const WITHER_GLYPH = '🥀';

export function Garden({ state }: { state: GardenState }) {
  const glyph = state.isWithering
    ? WITHER_GLYPH
    : HEALTHY_STAGES[Math.min(state.effectiveStage, HEALTHY_STAGES.length - 1)];

  const discColor = state.isWithering ? '#EFE1D2' : colors.surfaceAlt;

  return (
    <View style={styles.wrap}>
      <View style={[styles.disc, { backgroundColor: discColor }]}>
        <Text style={styles.glyph}>{glyph}</Text>
      </View>
      <Text style={styles.stage}>{stageLabel(state.effectiveStage)}</Text>
      <Text style={styles.caption}>{captionFor(state)}</Text>
    </View>
  );
}

function captionFor(state: GardenState): string {
  if (state.totalSessions === 0) {
    return 'Plant your garden by logging your first reading session.';
  }
  if (state.isWithering) {
    const d = state.daysSinceLast;
    return `Your garden is wilting — ${d} day${d === 1 ? '' : 's'} without reading. Read today to revive it.`;
  }
  if (state.sessionsToNextStage != null) {
    const n = state.sessionsToNextStage;
    return `${n} more session${n === 1 ? '' : 's'} to grow to the next stage.`;
  }
  return 'Your garden is in full bloom. Keep the streak alive!';
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  disc: {
    width: 180,
    height: 180,
    borderRadius: 90,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glyph: {
    fontSize: 96,
  },
  stage: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  caption: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
  },
});
