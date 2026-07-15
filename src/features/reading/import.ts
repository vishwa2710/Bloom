import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';

import { addDocument } from '@/db/repo';
import type { DocumentRow } from '@/db/schema';

const DOCS_DIR = FileSystem.documentDirectory + 'documents/';

async function ensureDocsDir(): Promise<void> {
  const info = await FileSystem.getInfoAsync(DOCS_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(DOCS_DIR, { intermediates: true });
  }
}

function titleFromFilename(name: string): string {
  return name.replace(/\.pdf$/i, '').replace(/[_-]+/g, ' ').trim() || 'Untitled';
}

function safeFilename(name: string): string {
  const base = name.replace(/[^a-zA-Z0-9._-]/g, '_');
  return `${Date.now()}_${base}`;
}

/**
 * Prompt the user for a PDF, copy it into the app's document directory (the
 * picker's cache URI is not durable), and register it in the database.
 *
 * Returns the created document, or `null` if the user cancelled.
 */
export async function importPdf(): Promise<DocumentRow | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: 'application/pdf',
    copyToCacheDirectory: true,
    multiple: false,
  });

  if (result.canceled || !result.assets?.length) return null;

  const asset = result.assets[0];
  await ensureDocsDir();

  const destUri = DOCS_DIR + safeFilename(asset.name ?? 'document.pdf');
  await FileSystem.copyAsync({ from: asset.uri, to: destUri });

  return addDocument({
    title: titleFromFilename(asset.name ?? 'Untitled'),
    fileUri: destUri,
  });
}
