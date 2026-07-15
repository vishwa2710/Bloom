import { eq } from 'drizzle-orm';

import { db } from '@/db/client';
import { preferences } from '@/db/schema';

export interface Preferences {
  remindersEnabled: boolean;
  /** Local hour (0–23) for the daily reading reminder. */
  reminderHour: number;
}

const DEFAULTS: Preferences = { remindersEnabled: true, reminderHour: 20 };

export async function getPreferences(): Promise<Preferences> {
  const rows = await db.select().from(preferences).where(eq(preferences.id, 1)).limit(1);
  const row = rows[0];
  if (!row) return DEFAULTS;
  return { remindersEnabled: row.remindersEnabled, reminderHour: row.reminderHour };
}

export async function updatePreferences(patch: Partial<Preferences>): Promise<Preferences> {
  const next: Partial<typeof preferences.$inferInsert> = {};
  if (patch.remindersEnabled !== undefined) next.remindersEnabled = patch.remindersEnabled;
  if (patch.reminderHour !== undefined) next.reminderHour = patch.reminderHour;

  if (Object.keys(next).length > 0) {
    await db.update(preferences).set(next).where(eq(preferences.id, 1));
  }
  return getPreferences();
}
