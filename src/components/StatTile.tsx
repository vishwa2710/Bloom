import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing } from '@/theme';

export function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.tile}>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    minWidth: 96,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.xs,
  },
  value: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
  },
  label: {
    fontSize: 12,
    color: colors.textMuted,
  },
});
