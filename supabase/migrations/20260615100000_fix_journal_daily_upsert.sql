/*
  The diary saves one entry per user and day using an upsert.
  This constraint makes that operation valid and prevents duplicate entries.
*/

CREATE UNIQUE INDEX IF NOT EXISTS idx_journal_entries_unique_daily
  ON journal_entries(user_id, entry_date);
