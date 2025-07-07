-- Minimal script to create banners bucket only
-- Policies should be created via Supabase Dashboard UI

-- 1. Create banners bucket (if it doesn't exist)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'banners',
  'banners', 
  true,
  10485760, -- 10MB limit
  ARRAY['image/png', 'image/jpeg', 'image/jpg']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. Verify the bucket was created
SELECT id, name, public, file_size_limit, allowed_mime_types 
FROM storage.buckets 
WHERE id = 'banners';

-- NOTE: Create policies manually via Supabase Dashboard:
-- Storage → Policies → banners bucket → New Policy
-- 1. "Banners Public Download" (SELECT, Policy: true)
-- 2. "Banners Public Upload" (INSERT, Policy: true) 