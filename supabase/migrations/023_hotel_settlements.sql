-- 호텔 정산 테이블
CREATE TABLE hotel_settlements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_partner_id UUID NOT NULL REFERENCES hotel_partners(id) ON DELETE RESTRICT,
  settlement_month VARCHAR(7) NOT NULL,  -- 'YYYY-MM' 형식
  completed_count INTEGER NOT NULL DEFAULT 0,
  incentive_per_count INTEGER NOT NULL DEFAULT 20000,
  total_amount INTEGER NOT NULL DEFAULT 0,
  status VARCHAR(20) DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'completed', 'on_hold')),
  paid_at TIMESTAMPTZ,
  memo TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(hotel_partner_id, settlement_month)
);

CREATE INDEX idx_hotel_settlements_hotel ON hotel_settlements(hotel_partner_id);
CREATE INDEX idx_hotel_settlements_month ON hotel_settlements(settlement_month);
CREATE INDEX idx_hotel_settlements_status ON hotel_settlements(status);

-- 정산 항목 테이블 (중복 정산 방지: application_id UNIQUE)
CREATE TABLE hotel_settlement_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  settlement_id UUID NOT NULL REFERENCES hotel_settlements(id) ON DELETE CASCADE,
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE RESTRICT,
  hotel_partner_id UUID NOT NULL REFERENCES hotel_partners(id),
  amount INTEGER NOT NULL DEFAULT 20000,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(application_id)  -- 중복 정산 방지 핵심 제약
);

CREATE INDEX idx_settlement_items_settlement ON hotel_settlement_items(settlement_id);
CREATE INDEX idx_settlement_items_application ON hotel_settlement_items(application_id);

-- RLS: 관리자만 접근 가능
ALTER TABLE hotel_settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE hotel_settlement_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage hotel settlements"
  ON hotel_settlements FOR ALL
  TO authenticated
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin')
  WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Admins can manage hotel settlement items"
  ON hotel_settlement_items FOR ALL
  TO authenticated
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin')
  WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- updated_at 트리거
CREATE TRIGGER update_hotel_settlements_updated_at
  BEFORE UPDATE ON hotel_settlements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- applications.settlement_id FK 추가 (023 마이그레이션에서 테이블 생성 후 설정)
ALTER TABLE applications
  ADD CONSTRAINT fk_applications_settlement
  FOREIGN KEY (settlement_id) REFERENCES hotel_settlements(id) ON DELETE SET NULL;
