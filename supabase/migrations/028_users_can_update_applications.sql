-- 유저가 본인 신청건의 상태를 업데이트할 수 있도록 RLS 정책 추가
-- (schedule-form, reservation-form, delivery-address-form 모두 이 정책이 필요함)

DROP POLICY IF EXISTS "Users can update own applications" ON applications;
CREATE POLICY "Users can update own applications"
  ON applications FOR UPDATE
  USING (user_id = auth.uid());

-- approved 상태인데 schedule_proposals 행이 존재하는 건들:
-- 날짜 제안은 됐지만 status 업데이트가 RLS에 막혀 stuck된 건들을 소급 처리
UPDATE applications a
SET status = 'schedule_proposed', updated_at = now()
WHERE a.status = 'approved'
  AND EXISTS (
    SELECT 1 FROM schedule_proposals sp
    WHERE sp.application_id = a.id
  );
