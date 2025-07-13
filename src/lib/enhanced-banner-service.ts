import { supabase } from '@/integrations/supabase/client';
import { analyzeProductImage } from './product-analysis';
import { generateBannerWithProductAndStyle } from './flux';
import { toast } from '@/hooks/use-toast';

export interface BannerCreationRequest {
  partnerId: string;
  partnerName: string;
  productImageFile: File;
  mainText: string;
  descriptionText: string;
  ctaText: string;
  discountPercentage?: number;
  styleAnalysis?: any;
}

export interface BannerCreationResult {
  bannerId: string;
  imageUrl: string;
  productDescription: string;
}

/**
 * Enhanced banner creation workflow:
 * 1. Analyze product image with OpenAI
 * 2. Generate banner background with Flux using style analysis
 * 3. Save banner data to database
 * 4. Return banner info for editor
 */
export async function createEnhancedBanner(
  request: BannerCreationRequest,
  onProgress?: (progress: number, status: string) => void
): Promise<BannerCreationResult> {
  try {
    console.log('Starting enhanced banner creation workflow...');
    onProgress?.(5, 'Iniciando creación de banner...');

    // Step 1: Analyze product image with OpenAI
    console.log('Step 1: Analyzing product image with OpenAI...');
    onProgress?.(15, 'Analizando imagen del producto con IA...');
    
    const productDescription = await analyzeProductImage(request.productImageFile);
    console.log('Product analysis completed:', productDescription);

    // Step 2: Generate banner background with Flux
    console.log('Step 2: Generating banner background with Flux...');
    onProgress?.(25, 'Generando fondo del banner con Flux...');

    const generatedBanner = await generateBannerWithProductAndStyle(
      request.partnerName,
      productDescription,
      request.styleAnalysis,
      request.productImageFile,
      request.mainText,
      request.ctaText,
      request.discountPercentage,
      (fluxProgress, fluxStatus) => {
        // Map Flux progress to overall progress (25-85% range)
        const mappedProgress = 25 + (fluxProgress * 0.6);
        onProgress?.(mappedProgress, fluxStatus);
      }
    );

    console.log('Banner generation completed:', generatedBanner.imageUrl);

    // Step 3: Upload image to Supabase storage (solves CORS and expiration issues)
    console.log('Step 3: Uploading banner to Supabase storage...');
    onProgress?.(85, 'Subiendo banner a almacenamiento...');

    // Import the upload function
    const { uploadImageToStorage } = await import('./banners');
    
    // Note: 'banners' bucket should be created manually via SQL (see documentation)
    
    // Generate unique filename
    const timestamp = Date.now();
    const fileName = `enhanced-banner-${request.partnerId}-${timestamp}.png`;
    
    // Upload the generated image to Supabase storage
    let storageImageUrl: string;
    try {
      storageImageUrl = await uploadImageToStorage(
        generatedBanner.imageUrl, 
        fileName, 
        'banners'
      );
      console.log('Image uploaded to storage:', storageImageUrl);
    } catch (storageError) {
      console.error('Storage upload failed:', storageError);
      
      // Provide specific error message if bucket doesn't exist
      const errorMessage = storageError instanceof Error ? storageError.message : String(storageError);
      if (errorMessage.includes('bucket') || errorMessage.includes('not found')) {
        throw new Error('El bucket "banners" no existe en Supabase. Por favor ejecuta el script SQL create_banners_bucket.sql en tu Supabase SQL Editor.');
      } else {
        throw new Error(`Error subiendo imagen a almacenamiento: ${errorMessage}`);
      }
    }

    // Step 4: Save banner to database with storage URL
    console.log('Step 4: Saving banner to database...');
    onProgress?.(90, 'Guardando banner en base de datos...');

    const bannerTitle = `Banner - ${request.partnerName} - ${new Date().toLocaleDateString()}`;

    const { data: bannerData, error: saveError } = await supabase
      .from('banners')
      .insert({
        partner_id: request.partnerId,
        image_url: storageImageUrl, // Use storage URL instead of Flux URL
        image_type: 'desktop',
        prompt_used: generatedBanner.prompt,
        banner_title: bannerTitle,
        product_description: productDescription,
        main_text: request.mainText,
        description_text: request.descriptionText,
        cta_text: request.ctaText,
        discount_percentage: request.discountPercentage || null,
      })
      .select()
      .single();

    if (saveError) {
      console.error('Error saving banner to database:', saveError);
      throw new Error(`Failed to save banner: ${saveError.message}`);
    }

    console.log('Banner saved successfully:', bannerData.id);
    onProgress?.(100, 'Banner creado exitosamente');

    // Dispatch custom event for banner save
    window.dispatchEvent(new CustomEvent('bannerSaved', { 
      detail: { bannerId: bannerData.id, partnerId: request.partnerId }
    }));

    toast({
      title: "Banner creado exitosamente",
      description: "Tu banner ha sido generado y guardado. Se abrirá el editor para agregar logo y elementos finales.",
    });

    return {
      bannerId: bannerData.id,
      imageUrl: storageImageUrl, // Return storage URL instead of Flux URL
      productDescription: productDescription
    };

  } catch (error) {
    console.error('Error in enhanced banner creation:', error);
    
    // Provide more helpful error messages
    let userFriendlyMessage = 'Error desconocido';
    
    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase();
      
      if (errorMessage.includes('openai') || errorMessage.includes('api key')) {
        userFriendlyMessage = 'Error de configuración de OpenAI. Verifica tu API key.';
      } else if (errorMessage.includes('flux')) {
        userFriendlyMessage = 'Error en la generación con Flux. Verifica tu API key de Flux.';
      } else if (errorMessage.includes('image') || errorMessage.includes('base64')) {
        userFriendlyMessage = 'Error procesando la imagen. Intenta con una imagen diferente.';
      } else if (errorMessage.includes('fetch') || errorMessage.includes('network')) {
        userFriendlyMessage = 'Error de conexión. Verifica tu conexión a internet.';
      } else if (errorMessage.includes('file')) {
        userFriendlyMessage = 'Error con el archivo de imagen. Asegúrate de que sea una imagen válida.';
      } else {
        userFriendlyMessage = error.message;
      }
    }
    
    toast({
      title: "Error en la creación del banner",
      description: userFriendlyMessage,
      variant: "destructive",
    });

    throw new Error(userFriendlyMessage);
  }
}

/**
 * Get banner data for editor
 */
export async function getBannerForEditor(bannerId: string) {
  try {
    const { data: banner, error } = await supabase
      .from('banners')
      .select(`
        *,
        partners (
          name,
          logo_url,
          reference_style_analysis
        )
      `)
      .eq('id', bannerId)
      .single();

    if (error) {
      throw new Error(`Failed to fetch banner: ${error.message}`);
    }

    return banner;
  } catch (error) {
    console.error('Error fetching banner for editor:', error);
    throw error;
  }
}

/**
 * Check if enhanced banner creation is available
 */
export function isEnhancedBannerCreationAvailable(): boolean {
  const hasOpenAI = !!import.meta.env.VITE_OPENAI_API_KEY && 
                   import.meta.env.VITE_OPENAI_API_KEY !== 'your_openai_api_key_here';
  const hasFlux = !!import.meta.env.VITE_FLUX_API_KEY && 
                 import.meta.env.VITE_FLUX_API_KEY !== 'your_flux_api_key_here';
  
  // Enhanced debugging for production issues
  if (!hasOpenAI || !hasFlux) {
    console.warn('Enhanced banner creation not available:', {
      hasOpenAI,
      hasFlux,
      openaiKey: import.meta.env.VITE_OPENAI_API_KEY ? `${import.meta.env.VITE_OPENAI_API_KEY.substring(0, 7)}...` : 'undefined',
      fluxKey: import.meta.env.VITE_FLUX_API_KEY ? `${import.meta.env.VITE_FLUX_API_KEY.substring(0, 7)}...` : 'undefined',
      environment: import.meta.env.MODE
    });
  }
  
  return hasOpenAI && hasFlux;
} 