-- 추천인 코드로 가입한 유저의 기존 신청건에 hotel_partner_id / hotel_code 소급 적용
UPDATE applications a
SET
  hotel_partner_id = p.first_hotel_partner_id,
  hotel_code       = p.first_hotel_code
FROM profiles p
WHERE a.user_id             = p.id
  AND p.first_hotel_partner_id IS NOT NULL
  AND a.hotel_partner_id    IS NULL;
