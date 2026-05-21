-- applications 테이블에 호텔 유입 및 정산 필드 추가
ALTER TABLE applications
  ADD COLUMN IF NOT EXISTS hotel_partner_id UUID REFERENCES hotel_partners(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS hotel_code VARCHAR(20),
  ADD COLUMN IF NOT EXISTS is_settlement_target BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS visit_completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS settlement_id UUID;

CREATE INDEX idx_applications_hotel ON applications(hotel_partner_id) WHERE hotel_partner_id IS NOT NULL;
CREATE INDEX idx_applications_settlement_target ON applications(is_settlement_target) WHERE is_settlement_target = TRUE;
