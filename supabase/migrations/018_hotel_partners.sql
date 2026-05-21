-- 호텔 파트너 관리 테이블
CREATE TABLE hotel_partners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  address TEXT,
  contact_name VARCHAR(100),
  contact_phone VARCHAR(50),
  contact_email VARCHAR(255),
  partner_code VARCHAR(20) UNIQUE NOT NULL,
  incentive_per_completion INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_hotel_partners_partner_code ON hotel_partners(partner_code);
CREATE INDEX idx_hotel_partners_status ON hotel_partners(status);

ALTER TABLE hotel_partners ENABLE ROW LEVEL SECURITY;

-- 관리자만 CRUD 가능
CREATE POLICY "Admins can manage hotel partners"
  ON hotel_partners FOR ALL
  TO authenticated
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin')
  WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- updated_at 자동 갱신 트리거
CREATE TRIGGER update_hotel_partners_updated_at
  BEFORE UPDATE ON hotel_partners
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
