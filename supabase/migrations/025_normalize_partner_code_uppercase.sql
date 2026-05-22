-- 기존 partner_code를 모두 대문자로 정규화
UPDATE hotel_partners
SET partner_code = UPPER(partner_code)
WHERE partner_code != UPPER(partner_code);
