-- 신청 인원 제한 제거
-- 모집인원을 초과해도 신청이 가능하도록 변경

-- 기존에 있을 수 있는 신청 제한 트리거 제거
DROP TRIGGER IF EXISTS check_application_limit_trigger ON applications;
DROP TRIGGER IF EXISTS enforce_application_limit ON applications;
DROP TRIGGER IF EXISTS limit_applications_trigger ON applications;

-- 기존에 있을 수 있는 신청 제한 함수 제거
DROP FUNCTION IF EXISTS check_application_limit();
DROP FUNCTION IF EXISTS enforce_application_limit();
DROP FUNCTION IF EXISTS limit_applications();

-- 기존 RLS 정책 제거 및 재생성 (제한 없이)
DROP POLICY IF EXISTS "Users can create applications with limit" ON applications;
DROP POLICY IF EXISTS "Users can create applications" ON applications;

-- 새로운 RLS 정책 생성 (제한 없이 신청 가능)
CREATE POLICY "Users can create applications"
  ON applications FOR INSERT
  WITH CHECK (user_id = auth.uid());
