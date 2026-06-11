-- ============================================================
-- 보안 강화: 권한 상승(privilege escalation) 차단
-- ============================================================
-- 배경: 기존 UPDATE RLS 정책들이 소유권(USING)만 확인하고 WITH CHECK / 컬럼
-- 제한이 없어, 클라이언트(anon key)로 직접 다음이 가능했음:
--   1) profiles.role = 'admin' 자가 설정 → 관리자 탈취
--   2) applications.status = 'approved'/'completed', is_settlement_target = true
--      자가 설정 → 선정/정산 위조
--   3) reviews.status = 'approved' 자가 설정 → 후기 심사 우회
--   4) schedule_proposals.confirmed_date 자가 설정 → 일정 확정 위조
--
-- RLS 정책은 컬럼 단위 값 제약을 표현하기 어려우므로, BEFORE INSERT/UPDATE
-- 트리거로 "비관리자는 보호 컬럼을 바꿀 수 없고, 허용된 상태 전이만 가능"하도록
-- 강제한다. 트리거는 anon/authenticated 등 어떤 클라이언트로 접근해도 동작한다.

-- 관리자 또는 서버(service_role)인지 판별
CREATE OR REPLACE FUNCTION public.is_privileged()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  claims text := current_setting('request.jwt.claims', true);
BEGIN
  -- 서버 측 admin client (service_role 키)는 RLS/트리거 제약 우회.
  -- SECURITY DEFINER 안에서는 current_user 가 함수 소유자라 신뢰 불가 → JWT claims 로 판별.
  IF claims IS NOT NULL AND claims <> ''
     AND (claims::json ->> 'role') = 'service_role' THEN
    RETURN true;
  END IF;
  -- 관리자 역할 프로필
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$;

-- ============================================================
-- profiles: 비관리자는 role / 추천인 귀속 컬럼을 변경할 수 없음
-- ============================================================
CREATE OR REPLACE FUNCTION public.enforce_profile_write()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.is_privileged() THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    -- 가입 시 권한은 항상 일반 사용자로 고정
    NEW.role := 'user';
  ELSE
    -- 보호 컬럼은 기존 값 유지 (관리자/서버만 변경 가능)
    NEW.role := OLD.role;
    NEW.first_hotel_partner_id := OLD.first_hotel_partner_id;
    NEW.first_hotel_code := OLD.first_hotel_code;
    NEW.referred_at := OLD.referred_at;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_profile_write ON public.profiles;
CREATE TRIGGER trg_enforce_profile_write
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.enforce_profile_write();

-- ============================================================
-- applications: 비관리자는 상태/정산 컬럼을 임의로 바꿀 수 없음
-- 허용된 사용자 상태 전이만 가능
-- ============================================================
CREATE OR REPLACE FUNCTION public.enforce_application_write()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.is_privileged() THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    -- 신규 신청은 항상 심사 대기로 시작, 관리자 전용 컬럼은 초기화
    NEW.user_id := auth.uid();
    NEW.status := 'pending';
    NEW.admin_note := NULL;
    NEW.is_settlement_target := false;
    NEW.visit_completed_at := NULL;
    -- 호텔 귀속은 클라이언트 값이 아니라 프로필에 기록된 추천 정보로 강제
    SELECT first_hotel_partner_id, first_hotel_code
      INTO NEW.hotel_partner_id, NEW.hotel_code
      FROM public.profiles
      WHERE id = auth.uid();
    RETURN NEW;
  END IF;

  -- UPDATE: 관리자 전용 컬럼은 기존 값 유지
  NEW.user_id := OLD.user_id;
  NEW.campaign_id := OLD.campaign_id;
  NEW.admin_note := OLD.admin_note;
  NEW.hotel_partner_id := OLD.hotel_partner_id;
  NEW.hotel_code := OLD.hotel_code;
  NEW.is_settlement_target := OLD.is_settlement_target;
  NEW.visit_completed_at := OLD.visit_completed_at;

  -- 상태 전이 검증: 사용자가 직접 수행할 수 있는 전이만 허용
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF NOT (
      (OLD.status = 'approved'              AND NEW.status = 'schedule_proposed') OR
      (OLD.status = 'scheduled'             AND NEW.status IN ('schedule_proposed', 'reservation_submitted')) OR
      (OLD.status = 'reservation_submitted' AND NEW.status = 'schedule_proposed')
    ) THEN
      RAISE EXCEPTION '허용되지 않은 상태 전이입니다: % -> %', OLD.status, NEW.status;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_application_write ON public.applications;
CREATE TRIGGER trg_enforce_application_write
  BEFORE INSERT OR UPDATE ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.enforce_application_write();

-- ============================================================
-- reviews: 비관리자는 승인/반려 상태나 관리자 피드백을 설정할 수 없음
-- ============================================================
CREATE OR REPLACE FUNCTION public.enforce_review_write()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.is_privileged() THEN
    RETURN NEW;
  END IF;

  -- 사용자가 직접 쓸 수 있는 상태는 'submitted'(제출/재제출) 뿐
  IF NEW.status IS DISTINCT FROM 'submitted' THEN
    NEW.status := 'submitted';
  END IF;

  -- 관리자 피드백은 사용자가 만들거나 바꿀 수 없음
  IF TG_OP = 'INSERT' THEN
    NEW.admin_feedback := NULL;
  ELSE
    NEW.admin_feedback := OLD.admin_feedback;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_review_write ON public.reviews;
CREATE TRIGGER trg_enforce_review_write
  BEFORE INSERT OR UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.enforce_review_write();

-- ============================================================
-- schedule_proposals: 비관리자는 confirmed_date 를 설정할 수 없음
-- (null 로 비우는 것은 재일정/취소 흐름상 허용)
-- ============================================================
CREATE OR REPLACE FUNCTION public.enforce_schedule_write()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.is_privileged() THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.confirmed_date := NULL;
  ELSIF NEW.confirmed_date IS NOT NULL
        AND NEW.confirmed_date IS DISTINCT FROM OLD.confirmed_date THEN
    -- 사용자가 새 확정일을 넣으려는 시도 → 기존 값 유지
    NEW.confirmed_date := OLD.confirmed_date;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_schedule_write ON public.schedule_proposals;
CREATE TRIGGER trg_enforce_schedule_write
  BEFORE INSERT OR UPDATE ON public.schedule_proposals
  FOR EACH ROW EXECUTE FUNCTION public.enforce_schedule_write();

NOTIFY pgrst, 'reload schema';
