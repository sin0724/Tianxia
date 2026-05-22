-- schedule_proposals 및 reservation_info 테이블에 관리자 RLS 정책 추가
-- (두 테이블 모두 Supabase Dashboard에서 직접 생성되어 관리자 정책이 없었음)

-- ============================================
-- schedule_proposals RLS 정책
-- ============================================

CREATE TABLE IF NOT EXISTS schedule_proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES applications(id) ON DELETE CASCADE UNIQUE,
  proposed_dates text[] NOT NULL DEFAULT '{}',
  preferred_time text,
  message text,
  confirmed_date text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE schedule_proposals ENABLE ROW LEVEL SECURITY;

-- 사용자: 본인 신청건의 일정 제안 조회
DROP POLICY IF EXISTS "Users can view own schedule proposals" ON schedule_proposals;
CREATE POLICY "Users can view own schedule proposals"
  ON schedule_proposals FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM applications
      WHERE applications.id = schedule_proposals.application_id
        AND applications.user_id = auth.uid()
    )
  );

-- 사용자: 본인 신청건에 일정 제안 등록
DROP POLICY IF EXISTS "Users can insert own schedule proposals" ON schedule_proposals;
CREATE POLICY "Users can insert own schedule proposals"
  ON schedule_proposals FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM applications
      WHERE applications.id = application_id
        AND applications.user_id = auth.uid()
    )
  );

-- 사용자: 본인 신청건 일정 제안 수정 (재제안)
DROP POLICY IF EXISTS "Users can update own schedule proposals" ON schedule_proposals;
CREATE POLICY "Users can update own schedule proposals"
  ON schedule_proposals FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM applications
      WHERE applications.id = schedule_proposals.application_id
        AND applications.user_id = auth.uid()
    )
  );

-- 관리자: 모든 일정 제안 조회
DROP POLICY IF EXISTS "Admins can view all schedule proposals" ON schedule_proposals;
CREATE POLICY "Admins can view all schedule proposals"
  ON schedule_proposals FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 관리자: 일정 확정 (confirmed_date 업데이트)
DROP POLICY IF EXISTS "Admins can update schedule proposals" ON schedule_proposals;
CREATE POLICY "Admins can update schedule proposals"
  ON schedule_proposals FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================
-- reservation_info RLS 정책
-- ============================================

CREATE TABLE IF NOT EXISTS reservation_info (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES applications(id) ON DELETE CASCADE UNIQUE,
  visitor_name text NOT NULL,
  reservation_datetime text NOT NULL,
  emergency_contact text NOT NULL,
  line_id text,
  selected_service text,
  special_requests text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE reservation_info ENABLE ROW LEVEL SECURITY;

-- 사용자: 본인 예약 정보 조회
DROP POLICY IF EXISTS "Users can view own reservation info" ON reservation_info;
CREATE POLICY "Users can view own reservation info"
  ON reservation_info FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM applications
      WHERE applications.id = reservation_info.application_id
        AND applications.user_id = auth.uid()
    )
  );

-- 사용자: 본인 예약 정보 등록
DROP POLICY IF EXISTS "Users can insert own reservation info" ON reservation_info;
CREATE POLICY "Users can insert own reservation info"
  ON reservation_info FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM applications
      WHERE applications.id = application_id
        AND applications.user_id = auth.uid()
    )
  );

-- 사용자: 본인 예약 정보 수정
DROP POLICY IF EXISTS "Users can update own reservation info" ON reservation_info;
CREATE POLICY "Users can update own reservation info"
  ON reservation_info FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM applications
      WHERE applications.id = reservation_info.application_id
        AND applications.user_id = auth.uid()
    )
  );

-- 관리자: 모든 예약 정보 조회
DROP POLICY IF EXISTS "Admins can view all reservation info" ON reservation_info;
CREATE POLICY "Admins can view all reservation info"
  ON reservation_info FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
