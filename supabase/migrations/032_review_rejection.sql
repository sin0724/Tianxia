-- 후기 반려 기능: rejected 상태 추가 + 관리자 반려 사유 컬럼
-- 반려된 후기는 유저가 사유를 확인하고 수정 후 재제출(status → submitted)할 수 있음

ALTER TYPE review_status ADD VALUE IF NOT EXISTS 'rejected';

ALTER TABLE reviews ADD COLUMN IF NOT EXISTS admin_feedback text;

-- PostgREST 스키마 캐시 갱신
NOTIFY pgrst, 'reload schema';
