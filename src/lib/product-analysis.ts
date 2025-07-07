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

    const prompt = `[PRODUCT ANALYSIS REQUEST]

You are a professional product marketing analyst. Analyze this product image and provide a comprehensive, marketing-focused description that will be used for AI banner generation.

[ANALYSIS REQUIREMENTS]
- Focus on visual elements that are important for marketing banners
- Describe the product's key features, colors, textures, and positioning
- Include details about lighting, composition, and visual appeal
- Note any text, logos, or branding visible in the image
- Describe the product's target market appeal
- Keep the description factual and detailed but concise

[OUTPUT FORMAT]
Provide a single paragraph description (150-300 words) that captures:
1. Product type and category
2. Visual characteristics (colors, materials, design)
3. Key features and benefits visible
4. Composition and presentation style
5. Marketing appeal and target audience

[EXAMPLE OUTPUT STYLE]
"Modern wireless bluetooth headphones in matte black finish with rose gold accents. Features over-ear design with plush padding, adjustable headband, and premium metal construction. The product is photographed against a clean white background with professional studio lighting, creating subtle shadows that enhance the premium aesthetic. Visible branding on the side panels suggests high-end audio equipment targeting young professionals and audiophiles. The sleek, minimalist design emphasizes sophistication and technological innovation, with clean lines and modern styling that would appeal to tech-savvy consumers aged 25-40."

[IMPORTANT]
- Write in a descriptive, marketing-oriented tone
- Focus on elements that would help an AI generate compelling banner backgrounds
- Avoid speculation - only describe what you can clearly see
- Keep it concise but comprehensive`;

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