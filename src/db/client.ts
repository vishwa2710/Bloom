import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';

import * as schema from './schema';

/**
 * We open the SQLite database synchronously so the Drizzle instance is ready
 * at import time, then bootstrap the tables once on app start via
 * {@link initDatabase}.
 *
 * The prototype uses idempotent `CREATE TABLE IF NOT EXISTS` bootstrapping
 * rather than drizzle-kit migration files. That keeps the setup free of the
 * extra Metro/SQL bundler config, which is the right trade for a prototype.
 * When the schema stabilises, switch to `drizzle-kit generate` + the
 * `drizzle-orm/expo-sqlite/migrator` and drop {@link initDatabase}.
 */
const expoDb = openDatabaseSync('bloom.db');

export const db = drizzle(expoDb, { schema });

let initialized = false;

export function initDatabase(): void {
  if (initialized) return;

  expoDb.execSync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY NOT NULL,
      title TEXT NOT NULL,
      source_type TEXT NOT NULL DEFAULT 'pdf',
      file_uri TEXT NOT NULL,
      page_count INTEGER,
      added_at INTEGER NOT NULL,
      last_opened_at INTEGER
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY NOT NULL,
      document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
      started_at INTEGER NOT NULL,
      ended_at INTEGER,
      duration_seconds INTEGER NOT NULL DEFAULT 0,
      start_page INTEGER,
      end_page INTEGER,
      pages_read INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS page_events (
      id TEXT PRIMARY KEY NOT NULL,
      session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
      page_number INTEGER NOT NULL,
      entered_at INTEGER NOT NULL,
      dwell_seconds REAL NOT NULL DEFAULT 0
    );

    CREATE INDEX IF NOT EXISTS idx_sessions_document ON sessions(document_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_started ON sessions(started_at);
    CREATE INDEX IF NOT EXISTS idx_page_events_session ON page_events(session_id);

    CREATE TABLE IF NOT EXISTS preferences (
      id INTEGER PRIMARY KEY NOT NULL DEFAULT 1,
      reminders_enabled INTEGER NOT NULL DEFAULT 1,
      reminder_hour INTEGER NOT NULL DEFAULT 20
    );
    INSERT OR IGNORE INTO preferences (id) VALUES (1);
  `);

  initialized = true;
}
