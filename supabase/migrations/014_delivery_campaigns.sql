-- Add delivery flag to campaigns
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS is_delivery boolean DEFAULT false;

-- Create delivery_addresses table
CREATE TABLE IF NOT EXISTS delivery_addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  recipient_name text NOT NULL,
  country text NOT NULL,
  city_state text NOT NULL,
  zipcode text NOT NULL,
  address text NOT NULL,
  mobile text NOT NULL,
  email text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS for delivery_addresses
ALTER TABLE delivery_addresses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own delivery addresses" ON delivery_addresses;
CREATE POLICY "Users can view own delivery addresses"
  ON delivery_addresses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM applications
      WHERE applications.id = delivery_addresses.application_id
        AND applications.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert own delivery addresses" ON delivery_addresses;
CREATE POLICY "Users can insert own delivery addresses"
  ON delivery_addresses FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM applications
      WHERE applications.id = delivery_addresses.application_id
        AND applications.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins can view all delivery addresses" ON delivery_addresses;
CREATE POLICY "Admins can view all delivery addresses"
  ON delivery_addresses FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
