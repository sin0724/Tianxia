-- Add drive_url to campaigns (Google Drive link shown only to visit_confirmed users)
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS drive_url text;

-- Add service_options to campaigns (newline-separated list of selectable items, e.g. procedures)
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS service_options text;

-- Add selected_service to reservation_info (user's chosen service/procedure)
ALTER TABLE reservation_info ADD COLUMN IF NOT EXISTS selected_service text;

-- Fix RLS for reviews table: allow authenticated users to insert reviews for their own applications
CREATE POLICY "Users can insert own reviews" ON reviews
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM applications
      WHERE applications.id = application_id
        AND applications.user_id = auth.uid()
    )
  );
