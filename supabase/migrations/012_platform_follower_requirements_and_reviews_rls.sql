-- Add platform_follower_requirements column to campaigns (stores per-platform min/max follower counts)
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS platform_follower_requirements jsonb;

-- Allow admins to view all submitted reviews
CREATE POLICY "Admins can view all reviews"
  ON reviews FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
