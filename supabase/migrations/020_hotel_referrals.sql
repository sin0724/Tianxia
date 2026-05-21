-- 호텔 QR 유입 회원 추적 테이블
CREATE TABLE hotel_referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_partner_id UUID NOT NULL REFERENCES hotel_partners(id) ON DELETE CASCADE,
  hotel_code VARCHAR(20) NOT NULL,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_hotel_referrals_hotel ON hotel_referrals(hotel_partner_id);
CREATE INDEX idx_hotel_referrals_user ON hotel_referrals(user_id);

ALTER TABLE hotel_referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage hotel referrals"
  ON hotel_referrals FOR ALL
  TO authenticated
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin')
  WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');
