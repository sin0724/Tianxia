-- Add translated service options column for user-facing display
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS service_options_zh_tw text;
