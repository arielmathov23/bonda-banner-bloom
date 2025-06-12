# OpenAI Banner Generation Setup

## Overview

This integration generates promotional banner images using OpenAI's Image API, dynamically crafted from your partner and benefit information.

## Features

✅ **AI-Powered Banner Generation** - Uses OpenAI's `gpt-image-1` model for image creation
✅ **Dynamic Prompt Creation** - Automatically generates prompts from partner data and benefits  
✅ **Reference Image Support** - Uses partner logos, reference banners, and product photos
✅ **Brand Color Integration** - Extracts and applies brand colors automatically
✅ **Multiple Style Options** - Audaz y Dinámico, Minimalista, Vibrante
✅ **16:9 Aspect Ratio** - Perfect for web banners
✅ **Download & Save** - Direct download and project saving capabilities

## Setup Instructions

### 1. Get Your OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Sign in or create an account
3. Navigate to "API Keys" section  
4. Click "Create new secret key"
5. Copy your API key (starts with `sk-`)

### 2. Configure Environment Variables

Create a `.env.local` file in your project root and add:

```bash
VITE_OPENAI_API_KEY=your_openai_api_key_here
```

**Important:** 
- Never commit your API key to version control
- The `.env.local` file is already in `.gitignore`
- Keep your API key secure and don't share it

### 3. Restart Development Server

After adding the API key, restart your development server:

```bash
npm run dev
```

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

### API Models Used
- **gpt-image-1** - For reference image editing (preferred when logos/assets available)
- **dall-e-3** - Fallback for generation without reference images

### Image Specifications
- **Aspect Ratio:** 16:9 (perfect for web banners)
- **Resolution:** 1792x1024px (high quality)
- **Format:** PNG with transparency support
- **Optimization:** Web-ready compression

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