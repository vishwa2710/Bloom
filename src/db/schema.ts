import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

/**
 * A document the user has imported to read. The prototype only supports PDFs,
 * but `sourceType` is here so EPUB / article sources slot in later without a
 * migration headache.
 */
export const documents = sqliteTable('documents', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  sourceType: text('source_type').notNull().$default(() => 'pdf'),
  /** file:// URI inside the app's document directory. */
  fileUri: text('file_uri').notNull(),
  pageCount: integer('page_count'),
  /** Epoch milliseconds. */
  addedAt: integer('added_at').notNull(),
  lastOpenedAt: integer('last_opened_at'),
});

/**
 * One reading session. `durationSeconds` is *active* reading time only —
 * time while the app was backgrounded or the reader was idle is excluded.
 */
export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  documentId: text('document_id')
    .notNull()
    .references(() => documents.id, { onDelete: 'cascade' }),
  startedAt: integer('started_at').notNull(),
  endedAt: integer('ended_at'),
  durationSeconds: integer('duration_seconds').notNull().$default(() => 0),
  startPage: integer('start_page'),
  endPage: integer('end_page'),
  /** Distinct pages visited during the session. */
  pagesRead: integer('pages_read').notNull().$default(() => 0),
});

/**
 * Per-page dwell records. One row per (session, page) visit — this is what
 * powers "time per page" and lets us reconstruct reading pace.
 */
export const pageEvents = sqliteTable('page_events', {
  id: text('id').primaryKey(),
  sessionId: text('session_id')
    .notNull()
    .references(() => sessions.id, { onDelete: 'cascade' }),
  pageNumber: integer('page_number').notNull(),
  enteredAt: integer('entered_at').notNull(),
  /** Active seconds spent on this page (fractional). */
  dwellSeconds: real('dwell_seconds').notNull().$default(() => 0),
});

export type DocumentRow = typeof documents.$inferSelect;
export type SessionRow = typeof sessions.$inferSelect;
export type PageEventRow = typeof pageEvents.$inferSelect;
