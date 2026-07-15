import { desc, eq, sql } from 'drizzle-orm';

import { createId } from '@/lib/id';
import { calendarDaysBetween, startOfLocalDay } from '@/lib/time';

import { db } from './client';
import { documents, pageEvents, sessions, type DocumentRow, type SessionRow } from './schema';

/* -------------------------------------------------------------------------- */
/* Documents                                                                  */
/* -------------------------------------------------------------------------- */

export async function addDocument(input: {
  title: string;
  fileUri: string;
  pageCount?: number | null;
}): Promise<DocumentRow> {
  const row: DocumentRow = {
    id: createId('doc'),
    title: input.title,
    sourceType: 'pdf',
    fileUri: input.fileUri,
    pageCount: input.pageCount ?? null,
    addedAt: Date.now(),
    lastOpenedAt: null,
  };
  await db.insert(documents).values(row);
  return row;
}

export async function listDocuments(): Promise<DocumentRow[]> {
  return db.select().from(documents).orderBy(desc(documents.addedAt));
}

export async function getDocument(id: string): Promise<DocumentRow | undefined> {
  const rows = await db.select().from(documents).where(eq(documents.id, id)).limit(1);
  return rows[0];
}

export async function touchDocument(id: string): Promise<void> {
  await db
    .update(documents)
    .set({ lastOpenedAt: Date.now() })
    .where(eq(documents.id, id));
}

export async function setDocumentPageCount(id: string, pageCount: number): Promise<void> {
  await db.update(documents).set({ pageCount }).where(eq(documents.id, id));
}

export async function deleteDocument(id: string): Promise<void> {
  await db.delete(documents).where(eq(documents.id, id));
}

/* -------------------------------------------------------------------------- */
/* Sessions                                                                   */
/* -------------------------------------------------------------------------- */

export async function startSession(input: {
  documentId: string;
  startPage: number;
}): Promise<string> {
  const id = createId('ses');
  await db.insert(sessions).values({
    id,
    documentId: input.documentId,
    startedAt: Date.now(),
    startPage: input.startPage,
    endPage: input.startPage,
  });
  return id;
}

export async function recordPageEvent(input: {
  sessionId: string;
  pageNumber: number;
  dwellSeconds: number;
}): Promise<void> {
  await db.insert(pageEvents).values({
    id: createId('pev'),
    sessionId: input.sessionId,
    pageNumber: input.pageNumber,
    enteredAt: Date.now(),
    dwellSeconds: input.dwellSeconds,
  });
}

export async function finalizeSession(
  id: string,
  input: { durationSeconds: number; endPage: number; pagesRead: number },
): Promise<void> {
  await db
    .update(sessions)
    .set({
      endedAt: Date.now(),
      durationSeconds: Math.round(input.durationSeconds),
      endPage: input.endPage,
      pagesRead: input.pagesRead,
    })
    .where(eq(sessions.id, id));
}

export type SessionWithDocument = SessionRow & { documentTitle: string };

export async function listSessionsWithDocument(): Promise<SessionWithDocument[]> {
  const rows = await db
    .select({
      session: sessions,
      documentTitle: documents.title,
    })
    .from(sessions)
    .innerJoin(documents, eq(sessions.documentId, documents.id))
    .where(sql`${sessions.endedAt} IS NOT NULL`)
    .orderBy(desc(sessions.startedAt));

  return rows.map((r) => ({ ...r.session, documentTitle: r.documentTitle }));
}

/**
 * Per-page dwell for a session, ordered by page number. Used by the history
 * detail to show reading pace.
 */
export async function getPageTimings(sessionId: string) {
  return db
    .select({
      pageNumber: pageEvents.pageNumber,
      dwellSeconds: pageEvents.dwellSeconds,
    })
    .from(pageEvents)
    .where(eq(pageEvents.sessionId, sessionId))
    .orderBy(pageEvents.pageNumber);
}

/* -------------------------------------------------------------------------- */
/* Reading summary (drives the garden)                                        */
/* -------------------------------------------------------------------------- */

export interface ReadingSummary {
  totalSessions: number;
  totalActiveSeconds: number;
  totalPagesRead: number;
  lastSessionAt: number | null;
  /** Consecutive calendar days (ending today or yesterday) with a session. */
  currentStreakDays: number;
}

export async function getReadingSummary(now = Date.now()): Promise<ReadingSummary> {
  const completed = await db
    .select({
      startedAt: sessions.startedAt,
      durationSeconds: sessions.durationSeconds,
      pagesRead: sessions.pagesRead,
    })
    .from(sessions)
    .where(sql`${sessions.endedAt} IS NOT NULL`)
    .orderBy(desc(sessions.startedAt));

  const totalSessions = completed.length;
  const totalActiveSeconds = completed.reduce((sum, s) => sum + s.durationSeconds, 0);
  const totalPagesRead = completed.reduce((sum, s) => sum + s.pagesRead, 0);
  const lastSessionAt = completed[0]?.startedAt ?? null;

  return {
    totalSessions,
    totalActiveSeconds,
    totalPagesRead,
    lastSessionAt,
    currentStreakDays: computeStreak(completed.map((s) => s.startedAt), now),
  };
}

/**
 * A streak is the run of consecutive calendar days with at least one session,
 * anchored to today. If the newest session was today or yesterday the streak
 * is alive; a two-day gap breaks it back to zero.
 */
export function computeStreak(sessionStartTimes: number[], now: number): number {
  if (sessionStartTimes.length === 0) return 0;

  // Distinct local days that have a session, newest first.
  const days = Array.from(
    new Set(sessionStartTimes.map((t) => startOfLocalDay(t))),
  ).sort((a, b) => b - a);

  const gapToNewest = calendarDaysBetween(days[0], now);
  if (gapToNewest > 1) return 0; // last activity was 2+ days ago — streak broken.

  let streak = 1;
  for (let i = 1; i < days.length; i++) {
    if (calendarDaysBetween(days[i], days[i - 1]) === 1) {
      streak += 1;
    } else {
      break;
    }
  }
  return streak;
}
