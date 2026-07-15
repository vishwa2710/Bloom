import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, spacing } from '@/theme';

/** Standard screen wrapper: safe-area padding + a themed background. */
export function Screen({
  children,
  scroll = true,
  refreshControl,
}: {
  children: ReactNode;
  scroll?: boolean;
  refreshControl?: React.ComponentProps<typeof ScrollView>['refreshControl'];
}) {
  const insets = useSafeAreaInsets();
  const padding = {
    paddingTop: insets.top + spacing.md,
    paddingBottom: insets.bottom + spacing.lg,
  };

  if (!scroll) {
    return <View style={[styles.container, padding]}>{children}</View>;
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, padding]}
      refreshControl={refreshControl}
    >
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    paddingHorizontal: spacing.md,
    gap: spacing.md,
  },
});
