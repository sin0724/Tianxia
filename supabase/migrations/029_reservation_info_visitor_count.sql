ALTER TABLE reservation_info ADD COLUMN IF NOT EXISTS visitor_count integer NOT NULL DEFAULT 1;
