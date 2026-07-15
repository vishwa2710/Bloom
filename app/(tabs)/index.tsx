import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { RefreshControl, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Garden } from '@/components/Garden';
import { Screen } from '@/components/Screen';
import { StatTile } from '@/components/StatTile';
import { getReadingSummary, type ReadingSummary } from '@/db/repo';
import { computeGardenState } from '@/features/garden/garden';
import { syncReminders } from '@/features/notifications/notifications';
import { formatDuration } from '@/lib/time';
import { colors, spacing } from '@/theme';

export default function GardenScreen() {
  const router = useRouter();
  const [summary, setSummary] = useState<ReadingSummary | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setSummary(await getReadingSummary());
    // Keep reminders in sync with the latest reading state (e.g. after a
    // session bumps the streak / resets the wither warning).
    void syncReminders();
  }, []);

  // Re-load whenever the tab regains focus (e.g. after finishing a session).
  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const garden = summary ? computeGardenState(summary) : null;

  return (
    <Screen
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Text style={styles.heading}>Your Garden</Text>

      {garden && summary ? (
        <>
          <Garden state={garden} />

          <View style={styles.statRow}>
            <StatTile label="Day streak" value={String(garden.currentStreakDays)} />
            <StatTile label="Sessions" value={String(summary.totalSessions)} />
            <StatTile label="Time read" value={formatDuration(summary.totalActiveSeconds)} />
          </View>

          <Button label="Start a reading session" onPress={() => router.push('/library')} />
        </>
      ) : (
        <Text style={styles.loading}>Loading your garden…</Text>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  heading: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
  },
  statRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  loading: {
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});
