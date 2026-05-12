-- map_urls: [{label?: string, url: string}]
ALTER TABLE campaigns
  ADD COLUMN IF NOT EXISTS map_urls jsonb DEFAULT '[]'::jsonb;
