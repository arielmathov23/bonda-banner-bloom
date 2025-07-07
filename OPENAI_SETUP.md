# AI Banner Generation Setup

## Overview

This app supports two powerful AI image generation services for creating promotional banners:

- **OpenAI GPT** - Using DALL-E for reliable, high-quality image generation
- **Flux Kontext Pro** - Black Forest Labs' advanced image editing with context-aware capabilities

Both services use the same partner data and prompts, allowing you to choose the best AI engine for your needs.

## Features

✅ **Dual AI Service Support** - Choose between OpenAI GPT and Flux Kontext Pro
✅ **AI-Powered Banner Generation** - High-quality image creation with both services
✅ **Dynamic Prompt Creation** - Automatically generates prompts from partner data and benefits  
✅ **Reference Image Support** - Uses partner logos, reference banners, and product photos
✅ **Brand Color Integration** - Extracts and applies brand colors automatically
✅ **Multiple Style Options** - Audaz y Dinámico, Minimalista, Vibrante
✅ **3:2 Aspect Ratio** - Perfect for promotional banners (1536x1024px)
✅ **Real-time Progress** - Live progress updates (especially for Flux)
✅ **Download & Save** - Direct download and project saving capabilities

## Setup Instructions

### Option 1: OpenAI Setup

#### 1. Get Your OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Sign in or create an account
3. Navigate to "API Keys" section  
4. Click "Create new secret key"
5. Copy your API key (starts with `sk-`)

#### 2. Configure OpenAI Environment Variable

Add to your `.env.local` file:

```bash
VITE_OPENAI_API_KEY=your_openai_api_key_here
```

### Option 2: Flux Kontext Pro Setup

#### 1. Get Your Flux API Key

1. Go to [Black Forest Labs API](https://api.bfl.ai/)
2. Sign in or create an account
3. Navigate to your account dashboard
4. Generate a new API key
5. Copy your API key

#### 2. Configure Flux Environment Variable

Add to your `.env.local` file:

```bash
VITE_FLUX_API_KEY=your_flux_api_key_here
```

### Both Services Setup

You can configure both services to switch between them:

```bash
# .env.local
VITE_OPENAI_API_KEY=your_openai_api_key_here
VITE_FLUX_API_KEY=your_flux_api_key_here
```

### Restart Development Server

After adding any API key, restart your development server:

```bash
npm run dev
```

**Important Security Notes:** 
- Never commit your API keys to version control
- The `.env.local` file is already in `.gitignore`
- Keep your API keys secure and don't share them
- For production, implement backend proxy for API calls

## How It Works

### 1. Partner Data Integration

The system automatically uses:
- **Partner Name** - Included prominently in banners
- **Benefits Description** - Integrated into promotional messaging
- **Logo** - Used as reference image for brand consistency
- **Reference Banners** - Style inspiration from existing materials
- **Product Photos** - Included when "Foto de Producto" flavor is selected
- **Partner URL** - Used for brand color extraction

### 2. Dynamic Prompt Generation

Each banner generation creates a unique prompt including:
- Partner brand information
- Selected benefits and promotional text
- Style preferences (Bold, Minimalist, Vibrant)
- Brand colors and visual guidelines
- Technical specifications for web use

### 3. Reference Image Processing

The system intelligently uses up to 4 reference images:
- Partner logo (for brand consistency)
- Reference banners (for style guidance)
- Product photos (when applicable)
- Automatically filters and validates image URLs

## Usage Guide

### Step 1: Select Partner
Choose from your configured partners. The system will load their:
- Available benefits
- Brand assets (logos, reference images)
- Style preferences

### Step 2: Configure Banner
- **Benefit Selection** - Choose which benefit to highlight
- **Promotional Text** - Main message for the banner
- **CTA Text** - Call-to-action button text
- **Style** - Visual approach (Bold, Minimalist, Vibrant)
- **Flavor** - Content type (Contextual or Product Photo)

### Step 3: Generate
Click "Generar Banner" to create your AI-powered banner. The system will:
- Build dynamic prompt from your selections
- Process reference images
- Generate high-quality 16:9 banner
- Provide both desktop and mobile versions

### Step 4: Download & Save
- **Download** - Get PNG files for immediate use
- **Save Project** - Store banner configurations for future reference

## Technical Details

### OpenAI Models Used
- **gpt-image-1** - For reference image editing (preferred when logos/assets available)
- **dall-e-3** - Fallback for generation without reference images

### Flux Kontext Pro Features
- **flux-kontext-pro** - Advanced image editing with reference context
- **Asynchronous Processing** - Real-time progress tracking
- **Context-Aware Generation** - Better understanding of reference images
- **Base64 Input** - Optimized for composite reference images

### Image Specifications
- **Aspect Ratio:** 3:2 (perfect for promotional banners)
- **Resolution:** 1536x1024px (high quality)
- **Format:** PNG with transparency support
- **Optimization:** Web-ready compression

### Service Comparison
| Feature | OpenAI GPT | Flux Kontext Pro |
|---------|------------|------------------|
| **Speed** | Fast (~10-15s) | Moderate (~30-60s) |
| **Context Understanding** | Good | Excellent |
| **Reference Images** | File-based | Base64-optimized |
| **Progress Tracking** | Simulated | Real-time |
| **Cost** | ~$0.04/image | Varies by usage |

### Error Handling
The system provides clear feedback for:
- Missing API configuration
- Invalid reference images
- API quota limitations
- Content policy violations
- Network connectivity issues

## Best Practices

### Partner Setup
1. **Upload Quality Logos** - High-resolution, clean background
2. **Add Reference Banners** - Examples of preferred styles
3. **Include Product Photos** - Clear, professional product images
4. **Write Clear Benefits** - Specific, actionable benefit descriptions

### Banner Creation
1. **Be Specific** - Detailed promotional text works better
2. **Match Style to Brand** - Choose style that fits partner's identity
3. **Test Different Flavors** - Try both contextual and product photo approaches
4. **Review Generated Content** - Always check before downloading

## Troubleshooting

### "Configuración faltante" Error
- Ensure `VITE_OPENAI_API_KEY` is set in `.env.local`
- Restart development server after adding the key
- Check for typos in the environment variable name

### "Error al generar banner" Messages
- **API Key Issues** - Verify your OpenAI API key is valid
- **Quota Exceeded** - Check your OpenAI account billing and limits
- **Content Policy** - Modify promotional text to comply with OpenAI policies
- **Network Issues** - Check internet connection and try again

### Poor Image Quality
- Ensure partner logos are high-resolution
- Add more descriptive promotional text
- Try different style options
- Check reference image URLs are accessible

## Cost Considerations

### OpenAI API Pricing
- **Image Generation** - ~$0.04 per image (dall-e-3)
- **Image Editing** - Varies based on model usage
- Monitor usage in your OpenAI dashboard

### Optimization Tips
- Use descriptive prompts to reduce regenerations
- Leverage reference images for better first-time results
- Set up proper partner data to minimize manual adjustments

## Support

For technical issues:
1. Check the browser console for detailed error messages
2. Verify your `.env.local` configuration
3. Test with a simple banner first
4. Review OpenAI API status and documentation

## Security Notes

⚠️ **Important Security Considerations:**
- API keys are exposed in browser (development only)
- For production, implement backend proxy for API calls
- Never commit `.env.local` to version control
- Regularly rotate your OpenAI API keys
- Monitor API usage for unexpected charges 