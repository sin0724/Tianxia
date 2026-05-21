-- hotel_partners 테이블 필드 추가 및 상태 확장
ALTER TABLE hotel_partners
  ADD COLUMN IF NOT EXISTS name_en VARCHAR(255),
  ADD COLUMN IF NOT EXISTS region VARCHAR(100);

-- 기존 status 제약 조건 교체 (보류 상태 추가)
ALTER TABLE hotel_partners DROP CONSTRAINT IF EXISTS hotel_partners_status_check;
ALTER TABLE hotel_partners ADD CONSTRAINT hotel_partners_status_check
  CHECK (status IN ('active', 'inactive', 'pending'));

-- 인센티브 기본값 20,000원으로 변경
ALTER TABLE hotel_partners ALTER COLUMN incentive_per_completion SET DEFAULT 20000;
