-- hotel_referrals: 일반 유저가 자신의 유입 정보를 INSERT할 수 있도록 정책 추가
-- 기존 정책(관리자 전용)은 유지하고 INSERT 전용 정책을 추가
CREATE POLICY "Users can insert own referral"
  ON hotel_referrals FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());
