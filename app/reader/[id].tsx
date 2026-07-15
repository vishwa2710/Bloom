import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import Pdf from 'react-native-pdf';

import { getDocument, setDocumentPageCount, touchDocument } from '@/db/repo';
import type { DocumentRow } from '@/db/schema';
import { useSessionTracker } from '@/features/reading/useSessionTracker';
import { formatDuration } from '@/lib/time';
import { colors, radius, spacing } from '@/theme';

export default function ReaderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [doc, setDoc] = useState<DocumentRow | null>(null);
  const [error, setError] = useState<string | null>(null);

  const tracker = useSessionTracker(id);

  useEffect(() => {
    let active = true;
    (async () => {
      const found = await getDocument(id);
      if (!active) return;
      setDoc(found ?? null);
      if (found) void touchDocument(found.id);
    })();
    return () => {
      active = false;
    };
  }, [id]);

  const onDone = async () => {
    await tracker.finish();
    router.back();
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: doc?.title ?? 'Reading',
          headerRight: () => (
            <Pressable onPress={onDone} hitSlop={12}>
              <Text style={styles.doneBtn}>Done</Text>
            </Pressable>
          ),
        }}
      />

      {error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>Couldn&apos;t open this PDF.</Text>
          <Text style={styles.errorDetail}>{error}</Text>
        </View>
      ) : !doc ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <>
          <Pdf
            source={{ uri: doc.fileUri, cache: true }}
            style={styles.pdf}
            onLoadComplete={(numberOfPages) => {
              tracker.onLoadComplete(numberOfPages);
              void setDocumentPageCount(doc.id, numberOfPages);
            }}
            onPageChanged={(page) => tracker.onPageChanged(page)}
            onPageSingleTap={() => tracker.registerInteraction()}
            onError={(err) => setError(String(err))}
          />

          <View style={styles.hud}>
            <HudItem
              label="Page"
              value={`${tracker.currentPage}${tracker.totalPages ? ` / ${tracker.totalPages}` : ''}`}
            />
            <HudItem label="This session" value={formatDuration(tracker.activeSeconds)} />
            <HudItem label="Pages read" value={String(tracker.pagesRead)} />
          </View>
        </>
      )}
    </View>
  );
}

function HudItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.hudItem}>
      <Text style={styles.hudValue}>{value}</Text>
      <Text style={styles.hudLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.lg,
  },
  pdf: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  hud: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    bottom: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  hudItem: {
    alignItems: 'center',
    gap: 2,
  },
  hudValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  hudLabel: {
    fontSize: 11,
    color: colors.textMuted,
  },
  doneBtn: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  errorText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.danger,
  },
  errorDetail: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
