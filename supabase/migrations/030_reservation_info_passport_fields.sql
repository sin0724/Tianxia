-- Replace visitor_name with passport_name (English name on passport) and add date_of_birth
ALTER TABLE reservation_info RENAME COLUMN visitor_name TO passport_name;
ALTER TABLE reservation_info ADD COLUMN IF NOT EXISTS date_of_birth date NOT NULL DEFAULT '2000-01-01';
ALTER TABLE reservation_info ALTER COLUMN date_of_birth DROP DEFAULT;
