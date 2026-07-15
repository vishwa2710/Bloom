import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { initDatabase } from '@/db/client';
import {
  configureNotificationHandler,
  ensureNotificationPermissions,
  syncReminders,
} from '@/features/notifications/notifications';
import { getPreferences } from '@/features/settings/preferences';
import { colors } from '@/theme';

configureNotificationHandler();

export default function RootLayout() {
  useEffect(() => {
    initDatabase();
    (async () => {
      // Prompt for permission on first launch only if reminders are enabled,
      // then schedule from current state.
      const prefs = await getPreferences();
      if (prefs.remindersEnabled) {
        await ensureNotificationPermissions();
      }
      await syncReminders();
    })();
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="reader/[id]"
          options={{
            headerShown: true,
            title: 'Reading',
            headerStyle: { backgroundColor: colors.bg },
            headerTintColor: colors.text,
          }}
        />
      </Stack>
    </SafeAreaProvider>
  );
}
