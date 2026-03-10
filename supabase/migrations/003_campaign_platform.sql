-- 캠페인에 플랫폼 필드 추가
ALTER TABLE campaigns ADD COLUMN platform TEXT DEFAULT 'instagram';

-- 인덱스 추가
CREATE INDEX idx_campaigns_platform ON campaigns(platform);
