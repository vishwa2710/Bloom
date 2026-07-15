import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

import { type GardenState, stageLabel } from '@/features/garden/garden';
import { colors, radius, spacing } from '@/theme';

import { GardenPlant } from './GardenPlant';

/**
 * The garden home visual: an illustrated plant that grows with the effective
 * stage, sways gently while idle, fades in on mount, and "pops" when the plant
 * advances a stage.
 *
 * Animations use React Native's built-in Animated API (no extra native deps /
 * babel config). A future pass could move to Reanimated or Skia for richer
 * motion.
 */
export function Garden({ state }: { state: GardenState }) {
  const sway = useRef(new Animated.Value(0)).current;
  const pop = useRef(new Animated.Value(1)).current;
  const fade = useRef(new Animated.Value(0)).current;
  const prevStage = useRef<number | null>(null);

  // Entrance fade + continuous gentle sway.
  useEffect(() => {
    Animated.timing(fade, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(sway, {
          toValue: 1,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(sway, {
          toValue: 0,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [fade, sway]);

  // Celebratory pop when the plant advances a stage (not on first render).
  useEffect(() => {
    const current = state.effectiveStage;
    if (prevStage.current != null && current > prevStage.current) {
      Animated.sequence([
        Animated.spring(pop, { toValue: 1.18, friction: 3, useNativeDriver: true }),
        Animated.spring(pop, { toValue: 1, friction: 4, useNativeDriver: true }),
      ]).start();
    }
    prevStage.current = current;
  }, [state.effectiveStage, pop]);

  const rotate = sway.interpolate({
    inputRange: [0, 1],
    outputRange: state.isWithering ? ['-1deg', '1deg'] : ['-2.5deg', '2.5deg'],
  });

  return (
    <View style={styles.wrap}>
      <View style={[styles.stage, state.isWithering && styles.stageWither]}>
        <Animated.View
          style={{ opacity: fade, transform: [{ rotate }, { scale: pop }] }}
        >
          <GardenPlant stage={state.effectiveStage} withered={state.isWithering} size={220} />
        </Animated.View>
      </View>

      <Text style={styles.stageLabel}>{stageLabel(state.effectiveStage)}</Text>
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
  stage: {
    width: 240,
    height: 240,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceAlt,
  },
  stageWither: {
    backgroundColor: '#EFE6D8',
  },
  stageLabel: {
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
