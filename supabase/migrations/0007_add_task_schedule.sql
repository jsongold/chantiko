ALTER TABLE tasks
  ADD COLUMN scheduled_start_at TIMESTAMPTZ,
  ADD COLUMN scheduled_end_at   TIMESTAMPTZ;
