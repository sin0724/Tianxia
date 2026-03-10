-- platform 컬럼을 배열로 변경
ALTER TABLE campaigns DROP COLUMN IF EXISTS platform;
ALTER TABLE campaigns ADD COLUMN platforms TEXT[] DEFAULT ARRAY['instagram'];
