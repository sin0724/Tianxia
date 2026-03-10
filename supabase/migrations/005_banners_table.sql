-- 배너 테이블 생성
CREATE TABLE banners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  image_url TEXT NOT NULL,
  link_url TEXT,
  title TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_banners_active ON banners(is_active);
CREATE INDEX idx_banners_order ON banners(display_order);

-- RLS
ALTER TABLE banners ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 배너 조회 가능
CREATE POLICY "Anyone can view active banners"
  ON banners FOR SELECT
  USING (is_active = true);

-- 관리자만 배너 관리 가능
CREATE POLICY "Admins can manage banners"
  ON banners FOR ALL
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'admin'
    )
  );

-- Updated At 트리거
CREATE TRIGGER update_banners_updated_at
  BEFORE UPDATE ON banners
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
