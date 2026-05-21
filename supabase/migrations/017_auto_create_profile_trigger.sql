-- OAuth 유저를 위한 프로필 자동 생성 트리거
-- Google 로그인 시 auth.users에는 생성되지만 profiles에는 없어서 FK 오류 발생하는 문제 해결

-- 1. profiles 테이블 선택 컬럼 nullable 허용 (OAuth 유저는 일부 정보 없음)
ALTER TABLE profiles
  ALTER COLUMN line_id DROP NOT NULL,
  ALTER COLUMN region DROP NOT NULL,
  ALTER COLUMN instagram_handle DROP NOT NULL;

-- 2. auth.users에 신규 유저 생성 시 profiles 자동 생성하는 함수
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(COALESCE(NEW.email, 'user'), '@', 1)
    )
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. 트리거 등록
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
