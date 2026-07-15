import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { listDocuments } from '@/db/repo';
import type { DocumentRow } from '@/db/schema';
import { importPdf } from '@/features/reading/import';
import { relativeDay } from '@/lib/time';
import { colors, radius, spacing } from '@/theme';

export default function LibraryScreen() {
  const router = useRouter();
  const [docs, setDocs] = useState<DocumentRow[]>([]);
  const [importing, setImporting] = useState(false);

  const load = useCallback(async () => {
    setDocs(await listDocuments());
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const onImport = useCallback(async () => {
    try {
      setImporting(true);
      const doc = await importPdf();
      if (doc) {
        await load();
        router.push(`/reader/${doc.id}`);
      }
    } catch (err) {
      Alert.alert('Import failed', err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setImporting(false);
    }
  }, [load, router]);

  return (
    <Screen>
      <Text style={styles.heading}>Library</Text>

      <Button
        label={importing ? 'Importing…' : '+ Import a PDF'}
        onPress={onImport}
        disabled={importing}
      />

      {docs.length === 0 ? (
        <Text style={styles.empty}>
          No documents yet. Import a PDF to start reading and grow your garden.
        </Text>
      ) : (
        <View style={styles.list}>
          {docs.map((doc) => (
            <Pressable
              key={doc.id}
              style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
              onPress={() => router.push(`/reader/${doc.id}`)}
            >
              <Text style={styles.title} numberOfLines={2}>
                {doc.title}
              </Text>
              <Text style={styles.meta}>
                {doc.pageCount ? `${doc.pageCount} pages · ` : ''}
                Added {relativeDay(doc.addedAt, Date.now())}
              </Text>
            </Pressable>
          ))}
        </View>
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
    gap: spacing.xs,
  },
  cardPressed: {
    opacity: 0.7,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  meta: {
    fontSize: 13,
    color: colors.textMuted,
  },
});
