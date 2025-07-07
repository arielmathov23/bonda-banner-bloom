# Banner Storage Fix

## Problem
The banner creation was failing with RLS (Row Level Security) errors because the `banners` bucket doesn't exist or doesn't have proper permissions.

## Solution

### Step 1: Create the Banners Bucket

1. **Go to your Supabase Dashboard**
2. **Navigate to SQL Editor**
3. **Run the following SQL script** (also available in `create_banners_bucket.sql`):

```sql
-- Create 'banners' bucket for storing generated banner images
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

-- Enable RLS and create policies
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all uploads to banners bucket" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'banners');

CREATE POLICY "Allow all reads from banners bucket" ON storage.objects
FOR SELECT USING (bucket_id = 'banners');

CREATE POLICY "Allow all updates to banners bucket" ON storage.objects
FOR UPDATE USING (bucket_id = 'banners') WITH CHECK (bucket_id = 'banners');

CREATE POLICY "Allow all deletes from banners bucket" ON storage.objects
FOR DELETE USING (bucket_id = 'banners');
```

### Step 2: Verify the Fix

1. **Check that the bucket was created:**
   ```sql
   SELECT * FROM storage.buckets WHERE id = 'banners';
   ```

2. **You should see a bucket with:**
   - `id: 'banners'`
   - `public: true`
   - `file_size_limit: 10485760`

### Step 3: Test Banner Creation

1. **Try creating a new banner**
2. **The banner should now:**
   - ✅ Generate successfully
   - ✅ Upload to Supabase storage
   - ✅ Be accessible without CORS issues
   - ✅ Download with full background

## What This Fixes

- ✅ **No more 403 errors** - Images stored permanently in Supabase
- ✅ **No more CORS issues** - Supabase storage doesn't have CORS restrictions  
- ✅ **Cross-browser compatibility** - Same images accessible everywhere
- ✅ **Proper downloads** - Canvas export works with stored images

## File Structure

After the fix, your Supabase storage will have:

```
partner-assets/
  ├── brand-manuals/
  ├── logos/
  ├── product-photos/
  └── reference-banners/

banners/                    # ← NEW!
  ├── enhanced-banner-{partnerId}-{timestamp}.png
  ├── enhanced-banner-{partnerId}-{timestamp}.png
  └── ...
```

## Troubleshooting

If you still get errors:

1. **Check Supabase permissions** - Make sure your project has storage enabled
2. **Verify RLS policies** - The policies should allow public access to the banners bucket
3. **Check bucket exists** - Run `SELECT * FROM storage.buckets;` to see all buckets
4. **Contact support** - If issues persist, check Supabase documentation or support 