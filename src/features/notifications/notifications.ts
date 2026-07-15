import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { GARDEN_CONFIG } from '@/config';
import { getReadingSummary, type ReadingSummary } from '@/db/repo';
import { getPreferences, type Preferences } from '@/features/settings/preferences';
import { startOfLocalDay } from '@/lib/time';

const CHANNEL_ID = 'reading-reminders';
const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * How foreground notifications behave. Called once at app start.
 */
export function configureNotificationHandler(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Reading reminders',
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

/**
 * Request notification permission, prompting the user if not yet decided.
 * Returns whether notifications are permitted.
 */
export async function ensureNotificationPermissions(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

/**
 * Cancel and re-schedule Bloom's reminders from the given state. Does not
 * prompt for permission — schedules only if already granted. Call
 * {@link ensureNotificationPermissions} first when the user opts in.
 */
export async function rescheduleReminders(
  summary: ReadingSummary,
  prefs: Preferences,
  now = Date.now(),
): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  if (!prefs.remindersEnabled) return;

  const { granted } = await Notifications.getPermissionsAsync();
  if (!granted) return;

  await ensureAndroidChannel();

  // Daily nudge to keep the reading habit (and the garden) alive.
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Time to read 🌱',
      body: 'A few focused pages keeps your garden growing.',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: prefs.reminderHour,
      minute: 0,
      channelId: CHANNEL_ID,
    },
  });

  // Targeted warning on the evening the garden would begin to wither.
  if (summary.lastSessionAt != null) {
    const witherDayStart =
      startOfLocalDay(summary.lastSessionAt) + GARDEN_CONFIG.witherAfterDays * MS_PER_DAY;
    const warnAt = new Date(witherDayStart);
    warnAt.setHours(prefs.reminderHour, 0, 0, 0);

    if (warnAt.getTime() > now) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Your garden needs you 🥀',
          body: 'Read today, or your garden will start to wither tomorrow.',
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: warnAt,
          channelId: CHANNEL_ID,
        },
      });
    }
  }
}

/**
 * Convenience: pull current preferences + reading summary and reschedule.
 * Safe to call on app start, after finishing a session, or on settings change.
 */
export async function syncReminders(now = Date.now()): Promise<void> {
  const [prefs, summary] = await Promise.all([getPreferences(), getReadingSummary(now)]);
  await rescheduleReminders(summary, prefs, now);
}
