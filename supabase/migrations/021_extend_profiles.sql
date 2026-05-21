-- profiles 테이블에 최초 호텔 유입 정보 추가
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS first_hotel_partner_id UUID REFERENCES hotel_partners(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS first_hotel_code VARCHAR(20),
  ADD COLUMN IF NOT EXISTS referred_at TIMESTAMPTZ;

CREATE INDEX idx_profiles_first_hotel ON profiles(first_hotel_partner_id) WHERE first_hotel_partner_id IS NOT NULL;
