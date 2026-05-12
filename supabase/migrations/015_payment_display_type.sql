ALTER TABLE campaigns
  ADD COLUMN IF NOT EXISTS payment_display_type text DEFAULT 'amount'
    CHECK (payment_display_type IN ('amount', 'negotiable', 'after_apply'));
