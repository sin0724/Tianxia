-- 카테고리 테이블 생성
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name_ko TEXT NOT NULL,
  name_zh TEXT NOT NULL,
  icon TEXT,
  is_featured BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_categories_featured ON categories(is_featured);
CREATE INDEX idx_categories_order ON categories(display_order);

-- RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 카테고리 조회 가능
CREATE POLICY "Anyone can view categories"
  ON categories FOR SELECT
  USING (true);

-- 관리자만 카테고리 관리 가능
CREATE POLICY "Admins can manage categories"
  ON categories FOR ALL
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'admin'
    )
  );

-- 기본 카테고리 데이터 삽입
INSERT INTO categories (name_ko, name_zh, icon, is_featured, display_order) VALUES
  ('레스토랑', '餐廳', '🍽️', true, 1),
  ('카페', '咖啡廳', '☕', true, 2),
  ('뷰티', '美容', '💄', true, 3),
  ('패션', '時尚', '👗', false, 4),
  ('여행', '旅遊', '✈️', true, 5),
  ('숙박', '住宿', '🏨', false, 6),
  ('피트니스', '健身', '💪', false, 7),
  ('테크', '科技', '📱', false, 8),
  ('라이프스타일', '生活', '🏠', true, 9),
  ('식품', '食品', '🍱', false, 10),
  ('엔터테인먼트', '娛樂', '🎬', false, 11),
  ('기타', '其他', '📦', false, 12);

-- Updated At 트리거
CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
