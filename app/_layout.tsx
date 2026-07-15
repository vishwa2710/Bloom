import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { initDatabase } from '@/db/client';
import { colors } from '@/theme';

export default function RootLayout() {
  useEffect(() => {
    initDatabase();
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
