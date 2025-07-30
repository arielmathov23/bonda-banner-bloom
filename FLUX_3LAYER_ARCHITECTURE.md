# 3-Layer Banner Generation Architecture

## Overview

The banner generation system has been restructured to follow a clean 4-step process with separate modules for better maintainability and clearer separation of concerns.

## Architecture Flow

```
A) Background Generation → B) Product Generation → C) Layer Overlay → D) Text/Logo Overlay
```

### Step A: Background Generation
**File:** `src/lib/flux-background.ts`
- Generates clean banner backgrounds without any products or text
- Optimized for text overlay and product placement
- Uses style analysis to create brand-consistent backgrounds
- Dimensions: 1440x352 (banner format)
- **Output:** Background image URL

### Step B: Product Generation  
**File:** `src/lib/flux-product.ts`
- Generates product cutouts with transparent backgrounds
- 1:1 aspect ratio (512x512) for optimal banner integration
- Professional isolation with clean edges
- **Output:** Product cutout image URL

### Step C: Layer Overlay (Background + Product)
**File:** `src/components/BannerEditor.tsx` (renderCanvas function)
- Canvas rendering: Background first, then product overlay
- Product positioned in center (35% width, horizontally and vertically centered)
- Automatic scaling maintaining aspect ratio

### Step D: Text/Logo Overlay
**File:** `src/components/BannerEditor.tsx` (renderCanvas function)  
- Text elements, CTA buttons, and logos rendered on top
- Interactive positioning and editing
- Fixed layout zones optimized for readability

## File Structure

```
src/lib/
├── flux-background.ts     # Step A - Background generation
├── flux-product.ts        # Step B - Product cutout generation  
├── flux.ts               # Shared utilities (imageUrlToBase64, FluxAPIClient, etc.)
├── enhanced-banner-service.ts  # Orchestrates A→B workflow
└── product-analysis.ts   # OpenAI product analysis

src/components/
└── BannerEditor.tsx      # Steps C+D - Canvas overlay rendering
```

## Workflow Implementation

### 1. Enhanced Banner Service
**File:** `src/lib/enhanced-banner-service.ts`

```typescript
// Step A: Generate background
const backgroundBanner = await generateBannerBackground(/*...*/);

// Step B: Generate product cutout  
const productCutout = await generateProductCutout(/*...*/);

// Save both images to database
return {
  backgroundImageUrl: backgroundStorageUrl,
  productImageUrl: productStorageUrl,
  // ...
};
```

### 2. Banner Editor Rendering
**File:** `src/components/BannerEditor.tsx`

```typescript
// Step C: Overlay product on background
ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
ctx.drawImage(productImage, productX, productY, productWidth, productHeight);

// Step D: Overlay text and logos
composition.assets.forEach(asset => {
  // Render text, logos, CTA buttons
});
```

## Database Schema

The database now supports 3-layer banners:

```sql
-- New fields added to banners table
ALTER TABLE banners 
ADD COLUMN background_image_url TEXT,  -- Step A output
ADD COLUMN product_image_url TEXT,     -- Step B output  
ADD COLUMN background_prompt TEXT,     -- Step A prompt
ADD COLUMN product_prompt TEXT;        -- Step B prompt
```

## Benefits

### Better Quality
- **Cleaner backgrounds:** Optimized for text overlay without product interference
- **Better product placement:** Professional isolation with transparent backgrounds
- **Enhanced composition:** Each layer optimized for its specific purpose

### Better Maintainability  
- **Modular code:** Each step in separate, focused files
- **Clear responsibilities:** Background vs product generation logic separated
- **Easier testing:** Each module can be tested independently
- **Better debugging:** Enhanced logging with step-specific emoji identifiers

### Better Performance
- **Parallel processing:** Both images can be generated simultaneously
- **Optimized prompts:** Specialized prompts for each layer type
- **Reduced complexity:** Simpler, more focused AI generation tasks

## Development Notes

### Console Logging
Each step uses emoji identifiers for easy debugging:
- 🎨 `[STEP A]` - Background generation  
- 🔳 `[STEP B]` - Product cutout generation
- 🖼️ `[STEP B]` - Image processing within product generation

### Error Handling
Each module has specialized error handling:
- Background generation errors include style analysis context
- Product generation errors include image processing details
- Canvas rendering has fallbacks for missing layers

### Backward Compatibility
The system maintains backward compatibility:
- Old banners still work with `image_url` fallback
- Legacy functions remain in `flux.ts` for existing integrations
- Database migration preserves existing data

## Testing the System

1. **Generate a new banner** - should follow A→B→C→D flow
2. **Check console logs** - should see step-specific emoji logging  
3. **Verify database** - should have both `background_image_url` and `product_image_url`
4. **Test editor** - should show 3 distinct layers in canvas

## Code Cleanup Summary

The following legacy/duplicate functions were removed from `flux.ts` to maintain clean separation:

### Removed Functions
- ❌ `testFluxConfiguration()` - Not used anywhere  
- ❌ `generateBannerWithProductAndStyle()` - Legacy single-step generation
- ❌ `generateStyledBannerPrompt()` - Legacy prompt, replaced by specialized prompts
- ❌ `generateBannerImageWithFlux()` - Legacy generation workflow
- ❌ `imageToBase64File()` - Duplicated, now only in `flux-product.ts`

### Remaining Utilities in flux.ts
- ✅ `validateFluxDimensions()` - Used by both modules
- ✅ `imageUrlToBase64()` - URL-based image conversion
- ✅ `createCompositeReferenceImage()` - Multi-image composition
- ✅ `FluxAPIClient` class - API interaction
- ✅ `isFluxConfigured()` - Configuration checking
- ✅ `getFluxAPIKeyStatus()` - Debug utilities

### Result
- **Background generation**: Only in `flux-background.ts`
- **Product generation**: Only in `flux-product.ts`  
- **Shared utilities**: Only in `flux.ts`
- **No duplication**: Each function exists in exactly one place
