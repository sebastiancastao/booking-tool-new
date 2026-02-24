-- Ensure contacts.date stores only date values (YYYY-MM-DD).
-- Run this in Supabase SQL Editor.

ALTER TABLE contacts
ADD COLUMN IF NOT EXISTS date DATE;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'contacts'
      AND column_name = 'date'
      AND data_type <> 'date'
  ) THEN
    ALTER TABLE contacts
    ALTER COLUMN date TYPE DATE
    USING COALESCE(created_at::date, CURRENT_DATE);
  END IF;
END $$;

UPDATE contacts
SET date = COALESCE(date, created_at::date, CURRENT_DATE)
WHERE date IS NULL;

ALTER TABLE contacts
ALTER COLUMN date SET DEFAULT CURRENT_DATE;
