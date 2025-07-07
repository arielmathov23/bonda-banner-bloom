-- Create banners bucket with same policies as partner-assets
-- Run this script in your Supabase SQL Editor

-- 1. Ensure banners bucket exists (using ON CONFLICT to avoid duplicate key error)
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

-- 2. Enable RLS on storage.objects (safe to run multiple times)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Drop existing banners policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Banners Public Download" ON storage.objects;
DROP POLICY IF EXISTS "Banners Public Upload" ON storage.objects;

-- 4. Create banners-specific SELECT policy (same as partner-assets "Public Download")
CREATE POLICY "Banners Public Download" ON storage.objects
FOR SELECT USING (bucket_id = 'banners');

-- 5. Create banners-specific INSERT policy (same as partner-assets "Public Upload")  
CREATE POLICY "Banners Public Upload" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'banners');

-- 6. Verify the policies were created
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
  AND policyname LIKE '%banners%'
ORDER BY policyname;

-- 7. Verify the bucket exists and is public
SELECT id, name, public, file_size_limit, allowed_mime_types 
FROM storage.buckets 
WHERE id = 'banners'; 