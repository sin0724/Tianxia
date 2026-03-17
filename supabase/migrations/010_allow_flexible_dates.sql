-- 체험 날짜가 신청 마감일보다 빠를 수 있도록 날짜 순서 제약조건 제거
-- 급하게 진행하는 캠페인의 경우 체험을 먼저 시작하고 신청은 계속 받을 수 있어야 함

-- campaigns 테이블의 CHECK 제약조건 제거
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT con.conname
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
    WHERE rel.relname = 'campaigns'
      AND nsp.nspname = 'public'
      AND con.contype = 'c'
  ) LOOP
    EXECUTE 'ALTER TABLE campaigns DROP CONSTRAINT IF EXISTS ' || quote_ident(r.conname);
  END LOOP;
END $$;

-- 날짜 순서를 강제하는 트리거가 있다면 제거
DROP TRIGGER IF EXISTS check_campaign_dates ON campaigns;
DROP TRIGGER IF EXISTS validate_campaign_dates ON campaigns;
DROP TRIGGER IF EXISTS enforce_campaign_dates ON campaigns;
DROP FUNCTION IF EXISTS check_campaign_dates();
DROP FUNCTION IF EXISTS validate_campaign_dates();
DROP FUNCTION IF EXISTS enforce_campaign_dates();
