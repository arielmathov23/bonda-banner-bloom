import OpenAI from 'openai';

// Initialize OpenAI client for product analysis
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

/**
 * Convert image file to base64 for OpenAI API with proper validation
 */
async function imageToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      // Validate file
      if (!file) {
        reject(new Error('No file provided'));
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        reject(new Error(`Invalid file type: ${file.type}. Expected image/*`));
        return;
      }
      
      if (file.size === 0) {
        reject(new Error('Empty file'));
        return;
      }
      
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        reject(new Error('File too large (max 10MB)'));
        return;
      }
      
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const result = reader.result as string;
          
          if (!result || typeof result !== 'string') {
            reject(new Error('Failed to read file as data URL'));
            return;
          }
          
          // Validate data URL format
          if (!result.startsWith('data:image/')) {
            reject(new Error('Invalid data URL format'));
            return;
          }
          
          // Remove data URL prefix (e.g., "data:image/png;base64,")
          const base64 = result.split(',')[1];
          
          if (!base64 || base64.length === 0) {
            reject(new Error('Empty base64 data'));
            return;
          }
          
          // Validate base64 format
          try {
            atob(base64);
          } catch (error) {
            reject(new Error('Invalid base64 encoding'));
            return;
          }
          
          console.log(`Successfully converted image to base64. Size: ${file.size} bytes, Base64 length: ${base64.length}`);
          resolve(base64);
        } catch (error) {
          reject(new Error(`Failed to process file data: ${error}`));
        }
      };
      reader.onerror = () => reject(new Error('FileReader error occurred'));
      reader.readAsDataURL(file);
    } catch (error) {
      reject(new Error(`Image processing error: ${error}`));
    }
  });
}

/**
 * Generate detailed product description from image using OpenAI Vision
 */
export async function analyzeProductImage(imageFile: File): Promise<string> {
  try {
    console.log('Starting product image analysis with OpenAI Vision...');

    // Convert image to base64
    const base64Image = await imageToBase64(imageFile);

    const prompt = `You are a professional product marketing analyst. Analyze this product image and provide a detailed description optimized for AI banner generation.

      ANALYZE AND DESCRIBE:
      - Product type, category, and premium positioning
      - Do not describe image background style and colors, only the product in terms of features, design.
      - Key design features, form factor, and visual appeal elements
      - Lighting, shadows, and photographic presentation quality
      - Target market appeal and brand positioning indicators

      BANNER INTEGRATION REQUIREMENTS:
      - Compatible background colors that enhance the product's visual appeal
      - Shadow/lighting needs for natural integration
      - Text overlay zones that work with product placement

      OUTPUT FORMAT:
      Single comprehensive paragraph (250-350 words) covering:
      1. Product identity and premium positioning
      2. Detailed visual characteristics (colors, materials, design)
      3. Banner integration specifications (size, position, background compatibility)
      4. Target audience and marketing appeal
      5. Technical quality and presentation style

      EXAMPLE:
      "Premium flagship smartphone in rose gold finish (#E8B4A0) with precision-machined aluminum frame and mirror-polished edges. Features sophisticated champagne-colored back panel with subtle texture variations and geometric camera array creating visual interest. Professional studio photography with controlled lighting and minimal shadows. Requires warm-toned backgrounds (cream, soft gold, neutrals) to enhance metallic finish. Casts natural shadows requiring subtle drop shadow in banner. Appeals to affluent professionals aged 25-45 seeking luxury technology. High visual weight demands balanced background elements. Text overlay works best in upper-left and lower-left quadrants. Excellent detail retention for large-format banner reproduction."

      Focus on elements that directly impact banner design decisions and AI generation quality.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Using gpt-4o-mini for vision capabilities
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: prompt
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${imageFile.type};base64,${base64Image}`,
                detail: "high"
              }
            }
          ]
        }
      ],
      max_tokens: 400,
      temperature: 0.3, // Lower temperature for more consistent, factual descriptions
    });

    const description = response.choices[0]?.message?.content;
    if (!description) {
      throw new Error('No description generated from OpenAI');
    }

    console.log('Product analysis completed successfully');
    console.log('Generated description:', description);

    return description.trim();

  } catch (error) {
    console.error('Error analyzing product image:', error);
    throw new Error(`Failed to analyze product image: ${error}`);
  }
}

/**
 * Check if product analysis is available (OpenAI configured)
 */
export function isProductAnalysisAvailable(): boolean {
  return !!import.meta.env.VITE_OPENAI_API_KEY && 
         import.meta.env.VITE_OPENAI_API_KEY !== 'your_openai_api_key_here';
} 