# Supabase 마이그레이션 실행 순서

Supabase Dashboard → SQL Editor에서 아래 파일을 **순서대로** 실행하세요.

1. `supabase/migrations/019_update_hotel_partners.sql`
2. `supabase/migrations/020_hotel_referrals.sql`
3. `supabase/migrations/021_extend_profiles.sql`
4. `supabase/migrations/022_extend_applications.sql`
5. `supabase/migrations/023_hotel_settlements.sql`
6. `supabase/migrations/024_fix_hotel_referrals_rls.sql`
