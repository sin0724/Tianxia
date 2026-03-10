-- Tianxia Platform Database Schema
-- 체험단 플랫폼 초기 스키마

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ENUM Types
CREATE TYPE user_role AS ENUM ('user', 'admin');
CREATE TYPE campaign_status AS ENUM ('draft', 'active', 'closed');
CREATE TYPE application_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE review_status AS ENUM ('pending', 'submitted', 'approved');

-- ============================================
-- profiles 테이블
-- ============================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  line_id TEXT NOT NULL,
  region TEXT NOT NULL,
  instagram_handle TEXT NOT NULL,
  instagram_url TEXT,
  threads_url TEXT,
  facebook_url TEXT,
  youtube_url TEXT,
  dcard_url TEXT,
  role user_role DEFAULT 'user' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- profiles 테이블 인덱스
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_region ON profiles(region);

-- ============================================
-- campaigns 테이블
-- ============================================
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category TEXT NOT NULL,
  region TEXT NOT NULL,
  thumbnail_url TEXT,
  recruitment_count INTEGER NOT NULL DEFAULT 1,
  application_deadline TIMESTAMPTZ NOT NULL,
  experience_date TIMESTAMPTZ NOT NULL,
  review_deadline TIMESTAMPTZ NOT NULL,
  status campaign_status DEFAULT 'draft' NOT NULL,
  
  -- 한국어 데이터 (관리자 입력)
  title_ko TEXT NOT NULL,
  brand_name_ko TEXT NOT NULL,
  summary_ko TEXT NOT NULL,
  description_ko TEXT NOT NULL,
  benefits_ko TEXT NOT NULL,
  requirements_ko TEXT NOT NULL,
  precautions_ko TEXT,
  
  -- 번체 중국어 데이터 (Claude 자동 번역)
  title_zh_tw TEXT,
  brand_name_zh_tw TEXT,
  summary_zh_tw TEXT,
  description_zh_tw TEXT,
  benefits_zh_tw TEXT,
  requirements_zh_tw TEXT,
  precautions_zh_tw TEXT,
  
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- campaigns 테이블 인덱스
CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_campaigns_category ON campaigns(category);
CREATE INDEX idx_campaigns_region ON campaigns(region);
CREATE INDEX idx_campaigns_deadline ON campaigns(application_deadline);
CREATE INDEX idx_campaigns_created_at ON campaigns(created_at DESC);

-- ============================================
-- applications 테이블
-- ============================================
CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  message TEXT,
  applied_instagram_url TEXT NOT NULL,
  applied_threads_url TEXT,
  applied_facebook_url TEXT,
  applied_youtube_url TEXT,
  applied_dcard_url TEXT,
  status application_status DEFAULT 'pending' NOT NULL,
  admin_note TEXT,
  applied_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- 중복 신청 방지
  UNIQUE(campaign_id, user_id)
);

-- applications 테이블 인덱스
CREATE INDEX idx_applications_campaign ON applications(campaign_id);
CREATE INDEX idx_applications_user ON applications(user_id);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_applications_applied_at ON applications(applied_at DESC);

-- ============================================
-- reviews 테이블
-- ============================================
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE NOT NULL UNIQUE,
  review_url TEXT NOT NULL,
  content TEXT,
  image_urls TEXT[],
  visited_at DATE,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  status review_status DEFAULT 'pending' NOT NULL
);

-- reviews 테이블 인덱스
CREATE INDEX idx_reviews_application ON reviews(application_id);
CREATE INDEX idx_reviews_status ON reviews(status);
CREATE INDEX idx_reviews_submitted_at ON reviews(submitted_at DESC);

-- ============================================
-- Updated At 트리거
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaigns_updated_at
  BEFORE UPDATE ON campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_applications_updated_at
  BEFORE UPDATE ON applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Row Level Security (RLS) 정책
-- ============================================

-- profiles 테이블 RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 사용자: 본인 프로필 조회
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- 사용자: 본인 프로필 수정
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- 관리자: 모든 프로필 조회
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 새 사용자: 프로필 생성 (회원가입 시)
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- campaigns 테이블 RLS
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

-- 모든 사용자: active 캠페인 조회
CREATE POLICY "Anyone can view active campaigns"
  ON campaigns FOR SELECT
  USING (status = 'active');

-- 관리자: 모든 캠페인 조회
CREATE POLICY "Admins can view all campaigns"
  ON campaigns FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 관리자: 캠페인 생성
CREATE POLICY "Admins can create campaigns"
  ON campaigns FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 관리자: 캠페인 수정
CREATE POLICY "Admins can update campaigns"
  ON campaigns FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 관리자: 캠페인 삭제
CREATE POLICY "Admins can delete campaigns"
  ON campaigns FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- applications 테이블 RLS
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- 사용자: 본인 신청 조회
CREATE POLICY "Users can view own applications"
  ON applications FOR SELECT
  USING (user_id = auth.uid());

-- 사용자: 신청 생성
CREATE POLICY "Users can create applications"
  ON applications FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- 관리자: 모든 신청 조회
CREATE POLICY "Admins can view all applications"
  ON applications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 관리자: 신청 상태 수정
CREATE POLICY "Admins can update applications"
  ON applications FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- reviews 테이블 RLS
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- 사용자: 본인 후기 조회
CREATE POLICY "Users can view own reviews"
  ON reviews FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM applications 
      WHERE applications.id = reviews.application_id 
      AND applications.user_id = auth.uid()
    )
  );

-- 사용자: 후기 생성 (승인된 신청건만)
CREATE POLICY "Users can create reviews for approved applications"
  ON reviews FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM applications 
      WHERE applications.id = application_id 
      AND applications.user_id = auth.uid()
      AND applications.status = 'approved'
    )
  );

-- 사용자: 본인 후기 수정
CREATE POLICY "Users can update own reviews"
  ON reviews FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM applications 
      WHERE applications.id = reviews.application_id 
      AND applications.user_id = auth.uid()
    )
  );

-- 관리자: 모든 후기 조회
CREATE POLICY "Admins can view all reviews"
  ON reviews FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 관리자: 후기 수정
CREATE POLICY "Admins can update reviews"
  ON reviews FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- Storage Bucket 설정 (썸네일, 후기 이미지용)
-- ============================================
-- Note: Storage bucket은 Supabase Dashboard에서 생성하거나
-- Supabase CLI를 통해 생성해야 합니다.

-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('campaign-images', 'campaign-images', true);

-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('review-images', 'review-images', true);
