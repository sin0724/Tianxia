-- Add bonus_application_count column to campaigns table
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS bonus_application_count INTEGER DEFAULT 0;
