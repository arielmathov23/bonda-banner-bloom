# Banner Database Implementation

This document explains the implementation of persistent banner storage using Supabase, replacing the previous localStorage-only approach.

## Overview

The previous implementation stored generated banners only in localStorage, which meant:
- ❌ Banners were lost when clearing browser data
- ❌ No cross-device/session persistence
- ❌ No proper backup or recovery
- ❌ Limited metadata storage
- ❌ Image URLs were temporary (expired after time)

The new implementation provides:
- ✅ Persistent storage in Supabase database
- ✅ Cross-device/session access
- ✅ Permanent image storage in Supabase Storage
- ✅ Rich metadata tracking
- ✅ Proper relationships with partners table
- ✅ Fallback to localStorage for backward compatibility

## Database Schema

### Banners Table

```sql
CREATE TABLE public.banners (
  -- Primary identification
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  
  -- Partner relationship (foreign key to partners table)
  partner_id uuid NOT NULL,
  
  -- Banner generation metadata
  banner_type text NOT NULL, -- 'promotion', 'general', etc.
  promotion_discount text NULL, -- discount percentage if applicable
  banner_copy text NOT NULL, -- main promotional text
  cta_copy text NOT NULL, -- call-to-action text
  custom_prompt text NULL, -- custom generation prompt if used
  
  -- Style and visual configuration
  selected_style text NOT NULL, -- style used for generation
  selected_flavor text NOT NULL, -- flavor/image type used
  ai_service text NOT NULL DEFAULT 'openai', -- 'openai' or 'flux'
  
  -- Generated image URLs (these will be Supabase Storage URLs)
  desktop_image_url text NOT NULL, -- URL to desktop version stored in Supabase Storage
  mobile_image_url text NOT NULL, -- URL to mobile version stored in Supabase Storage
  
  -- Generation metadata
  generation_prompt text NULL, -- actual prompt used for generation
  reference_images_used text[] NULL, -- array of reference image URLs
  brand_colors jsonb NULL, -- brand colors extracted/used: {"primary": "#hex", "secondary": "#hex"}
  
  -- Status and metrics
  status text NOT NULL DEFAULT 'completed' CHECK (status IN ('processing', 'completed', 'failed')),
  generation_time_ms integer NULL, -- time taken to generate in milliseconds
  
  -- Additional metadata
  dimensions text NOT NULL DEFAULT '1536x1024', -- image dimensions
  file_size_bytes integer NULL, -- file size in bytes
  
  -- Audit fields
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  
  -- Constraints
  CONSTRAINT banners_pkey PRIMARY KEY (id),
  CONSTRAINT banners_partner_id_fkey FOREIGN KEY (partner_id) REFERENCES public.partners(id) ON DELETE CASCADE
);
```

## Setup Instructions

### 1. Create the Database Table

Run the SQL commands in `create_banners_table.sql` in your Supabase SQL editor:

```bash
# Copy and paste the contents of create_banners_table.sql into Supabase SQL editor
```

### 2. Set Up Storage Bucket

Run the SQL commands in `create_storage_bucket.sql` in your Supabase SQL editor:

```bash
# Copy and paste the contents of create_storage_bucket.sql into Supabase SQL editor
```

### 3. Update TypeScript Types

The Supabase types have been updated in `src/integrations/supabase/types.ts` to include the new banners table structure.

## Code Changes

### New Files Created

1. **`src/lib/banners.ts`** - Banner database operations utility
   - `saveBannerToDatabase()` - Save banner with image upload
   - `getBanners()` - Retrieve banners (with optional partner filter)
   - `getBannerById()` - Get single banner
   - `deleteBanner()` - Delete banner and associated images
   - `updateBannerStatus()` - Update banner processing status
   - `uploadImageToStorage()` - Upload images to Supabase Storage

### Modified Files

1. **`src/components/BannerGeneration.tsx`**
   - Updated `saveBanner()` function to use database storage
   - Added image upload to Supabase Storage
   - Maintains localStorage as fallback
   - Enhanced error handling and user feedback

2. **`src/components/BannerHistory.tsx`**
   - Updated to load banners from database
   - Added loading states and skeleton UI
   - Implemented delete functionality
   - Maintains backward compatibility with localStorage

3. **`src/integrations/supabase/types.ts`**
   - Added TypeScript types for banners table
   - Proper relationship definitions

## Key Features

### Image Storage
- Generated images are uploaded to Supabase Storage
- Permanent URLs replace temporary AI service URLs
- Automatic cleanup when banners are deleted
- Support for both desktop and mobile versions

### Metadata Tracking
- Complete generation context preserved
- AI service used (OpenAI vs Flux)
- Generation prompts and reference images
- Brand colors and visual configuration
- Performance metrics (generation time)

### Status Management
- Track banner processing states: `processing`, `completed`, `failed`
- Automatic cleanup of failed banners
- Real-time status updates during generation

### Backward Compatibility
- Existing localStorage banners still work
- Gradual migration support
- Fallback mechanisms for offline scenarios

## Usage Examples

### Save a Generated Banner

```typescript
import { saveBannerToDatabase, SaveBannerData } from '@/lib/banners';

const bannerData: SaveBannerData = {
  partnerId: "partner-uuid",
  bannerType: "promotion",
  promotionDiscount: "20%",
  bannerCopy: "¡Gran descuento!",
  ctaCopy: "Comprar ahora",
  selectedStyle: "minimalista",
  selectedFlavor: "producto",
  aiService: "openai",
  desktopImageUrl: "https://temporary-ai-url.com/image.png",
  mobileImageUrl: "https://temporary-ai-url.com/mobile.png",
  generationPrompt: "Create a banner...",
  referenceImagesUsed: ["logo-url", "product-url"],
  brandColors: { primary: "#FF0000", secondary: "#00FF00" },
  generationTimeMs: 5000
};

const savedBanner = await saveBannerToDatabase(bannerData);
console.log('Banner saved with ID:', savedBanner.id);
```

### Load Banners

```typescript
import { getBanners } from '@/lib/banners';

// Get all banners
const allBanners = await getBanners();

// Get banners for specific partner
const partnerBanners = await getBanners('partner-uuid');
```

### Delete a Banner

```typescript
import { deleteBanner } from '@/lib/banners';

await deleteBanner('banner-uuid');
// Banner and associated images are permanently deleted
```

## Migration

### Automatic Migration
The system automatically detects and loads existing localStorage banners alongside database banners, providing a seamless transition.

### Manual Migration (Optional)
Use the `migrateLocalStorageBanners()` function to permanently move localStorage banners to the database:

```typescript
import { migrateLocalStorageBanners } from '@/lib/banners';

await migrateLocalStorageBanners();
```

## Database Management

Use the queries in `migrate_to_database.sql` for:
- Monitoring banner statistics
- Cleaning up failed banners
- Finding duplicates
- Performance analysis
- Storage usage tracking

## Security

### Row Level Security (RLS)
- Enabled on banners table
- Policies ensure users can only access appropriate data
- Storage bucket policies control image access

### Data Validation
- Foreign key constraints ensure partner relationships
- Check constraints validate status values
- Type safety through TypeScript interfaces

## Performance Considerations

### Indexing
- Partner ID index for fast filtering
- Created date index for chronological queries
- Status index for filtering by processing state

### Image Optimization
- Images are stored in optimal formats
- File size tracking for storage management
- Automatic cleanup prevents storage bloat

### Caching
- Local state management reduces database queries
- Image URLs are permanent (no re-fetching needed)
- Efficient pagination support for large datasets

## Error Handling

The implementation includes comprehensive error handling:
- Database connection issues fall back to localStorage
- Image upload failures are properly reported
- Network issues don't block banner generation
- User-friendly error messages in Spanish

## Future Enhancements

Potential improvements:
1. **Image Optimization**: Automatic resizing and compression
2. **Caching Layer**: Redis for frequently accessed banners
3. **Analytics**: Track banner usage and performance
4. **Versioning**: Keep history of banner modifications
5. **Sharing**: Public URLs for banner sharing
6. **Templates**: Save banners as reusable templates

## Troubleshooting

### Common Issues

1. **Storage Upload Fails**
   - Check Supabase storage bucket exists
   - Verify RLS policies are configured
   - Ensure proper authentication

2. **Database Queries Fail**
   - Verify table was created correctly
   - Check foreign key relationships
   - Confirm RLS policies allow access

3. **Images Not Loading**
   - Verify storage bucket is public
   - Check image URLs are correctly formed
   - Ensure CORS is configured for your domain

### Debug Queries

```sql
-- Check if banner exists
SELECT * FROM public.banners WHERE id = 'your-banner-id';

-- Check storage objects
SELECT * FROM storage.objects WHERE bucket_id = 'banners';

-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'banners';
```

## Support

For issues or questions:
1. Check the browser console for detailed error messages
2. Verify Supabase configuration and connectivity
3. Review the SQL files for proper database setup
4. Test with a simple banner save operation 