import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import { Screen } from '@/components/Screen';
import {
  ensureNotificationPermissions,
  syncReminders,
} from '@/features/notifications/notifications';
import {
  getPreferences,
  updatePreferences,
  type Preferences,
} from '@/features/settings/preferences';
import { colors, radius, spacing } from '@/theme';

function formatHour(hour: number): string {
  const period = hour < 12 ? 'AM' : 'PM';
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${h12}:00 ${period}`;
}

export default function SettingsScreen() {
  const [prefs, setPrefs] = useState<Preferences | null>(null);

  useFocusEffect(
    useCallback(() => {
      void (async () => setPrefs(await getPreferences()))();
    }, []),
  );

  const apply = useCallback(async (patch: Partial<Preferences>) => {
    const next = await updatePreferences(patch);
    setPrefs(next);
    await syncReminders();
  }, []);

  const onToggleReminders = useCallback(
    async (enabled: boolean) => {
      if (enabled) {
        const granted = await ensureNotificationPermissions();
        if (!granted) {
          Alert.alert(
            'Notifications are off',
            'Enable notifications for Bloom in your device settings to receive reading reminders.',
          );
          return;
        }
      }
      await apply({ remindersEnabled: enabled });
    },
    [apply],
  );

  const shiftHour = useCallback(
    (delta: number) => {
      if (!prefs) return;
      const hour = (prefs.reminderHour + delta + 24) % 24;
      void apply({ reminderHour: hour });
    },
    [prefs, apply],
  );

  return (
    <Screen>
      <Text style={styles.heading}>Settings</Text>

      <View style={styles.card}>
        <View style={styles.row}>
          <View style={styles.rowText}>
            <Text style={styles.rowTitle}>Daily reading reminder</Text>
            <Text style={styles.rowSubtitle}>
              A gentle nudge to read and keep your garden alive.
            </Text>
          </View>
          <Switch
            value={prefs?.remindersEnabled ?? false}
            onValueChange={onToggleReminders}
            trackColor={{ true: colors.primary }}
            disabled={!prefs}
          />
        </View>

        {prefs?.remindersEnabled && (
          <View style={[styles.row, styles.rowDivider]}>
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>Reminder time</Text>
              <Text style={styles.rowSubtitle}>When to send the daily nudge.</Text>
            </View>
            <View style={styles.stepper}>
              <Pressable style={styles.stepBtn} onPress={() => shiftHour(-1)} hitSlop={8}>
                <Text style={styles.stepBtnLabel}>−</Text>
              </Pressable>
              <Text style={styles.hourLabel}>{formatHour(prefs.reminderHour)}</Text>
              <Pressable style={styles.stepBtn} onPress={() => shiftHour(1)} hitSlop={8}>
                <Text style={styles.stepBtnLabel}>+</Text>
              </Pressable>
            </View>
          </View>
        )}
      </View>

      <Text style={styles.note}>
        Reminders are scheduled locally on your device — no account or network
        needed. Bloom also warns you the evening before your garden would begin
        to wither.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heading: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  rowDivider: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  rowSubtitle: {
    fontSize: 13,
    color: colors.textMuted,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  stepBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnLabel: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  hourLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    minWidth: 74,
    textAlign: 'center',
  },
  note: {
    fontSize: 13,
    color: colors.textMuted,
    paddingHorizontal: spacing.sm,
  },
});
