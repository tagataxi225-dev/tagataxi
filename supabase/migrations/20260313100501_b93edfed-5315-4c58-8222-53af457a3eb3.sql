ALTER TABLE marketplace_products ADD COLUMN IF NOT EXISTS video_url TEXT;
ALTER TABLE food_products ADD COLUMN IF NOT EXISTS video_url TEXT;