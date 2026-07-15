import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { listSessionsWithDocument, type SessionWithDocument } from '@/db/repo';
import { formatDuration, relativeDay } from '@/lib/time';
import { colors, radius, spacing } from '@/theme';

export default function HistoryScreen() {
  const [sessions, setSessions] = useState<SessionWithDocument[]>([]);

  const load = useCallback(async () => {
    setSessions(await listSessionsWithDocument());
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  return (
    <Screen>
      <Text style={styles.heading}>Reading History</Text>

      {sessions.length === 0 ? (
        <Text style={styles.empty}>
          No sessions yet. Your reading sessions and metrics will appear here.
        </Text>
      ) : (
        <View style={styles.list}>
          {sessions.map((s) => {
            const perPage = s.pagesRead > 0 ? s.durationSeconds / s.pagesRead : 0;
            return (
              <View key={s.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.title} numberOfLines={1}>
                    {s.documentTitle}
                  </Text>
                  <Text style={styles.day}>{relativeDay(s.startedAt, Date.now())}</Text>
                </View>
                <View style={styles.metrics}>
                  <Metric label="Duration" value={formatDuration(s.durationSeconds)} />
                  <Metric label="Pages" value={String(s.pagesRead)} />
                  <Metric label="Per page" value={formatDuration(perPage)} />
                </View>
              </View>
            );
          })}
        </View>
      )}
    </Screen>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  heading: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
  },
  empty: {
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
  list: {
    gap: spacing.sm,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  day: {
    fontSize: 13,
    color: colors.textMuted,
  },
  metrics: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  metric: {
    gap: 2,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  metricLabel: {
    fontSize: 12,
    color: colors.textMuted,
  },
});
