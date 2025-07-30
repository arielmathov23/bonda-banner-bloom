import { supabase } from '@/integrations/supabase/client';
import { analyzeProductImage } from './product-analysis';
import { generateBannerBackground } from './flux-background';
import { generateProductCutout } from './flux-product';
import { removeProductBackground, validateImageForProcessing, preloadBackgroundRemovalAssets, getPerformanceInfo } from './background-removal';
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
  backgroundImageUrl: string;
  productImageUrl: string;
  productDescription: string;
}

/**
 * Enhanced banner creation workflow (3-layer approach):
 * 1. Analyze product image with OpenAI
 * 2. Generate banner background only (no product) with Flux
 * 3. Generate enhanced product cutout with Flux using original image as reference
 * 4. Remove background from the enhanced product image 
 * 5. Save both images to storage
 * 6. Save banner data to database
 * 7. Return banner info for editor
 */
export async function createEnhancedBanner(
  request: BannerCreationRequest,
  onProgress?: (progress: number, status: string) => void
): Promise<BannerCreationResult> {
  try {
    console.log('🚀 Starting enhanced 3-layer banner creation workflow...');
    
    // Validate image before processing
    const validation = validateImageForProcessing(request.productImageFile);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }
    
    // Show warnings if any
    if (validation.warnings && validation.warnings.length > 0) {
      console.warn('⚠️ Image validation warnings:', validation.warnings);
      validation.warnings.forEach(warning => {
        toast({
          title: "Advertencia de imagen",
          description: warning,
          variant: "default"
        });
      });
    }

    // Show performance info
    const perfInfo = getPerformanceInfo();
    console.log('⚡ Background removal performance info:', perfInfo);
    
    onProgress?.(5, 'Iniciando creación de banner en 3 capas...');

    // Step 1: Analyze product image with OpenAI for style extraction
    console.log('Step 1: Analyzing product image for style information...');
    onProgress?.(10, 'Analizando estilo del producto con IA...');
    
    const productAnalysis = await analyzeProductImage(request.productImageFile);
    console.log('🎨 Product style analysis completed:', {
      description: productAnalysis.productDescription,
      dominantColors: productAnalysis.styleInfo.dominantColors,
      colorTemperature: productAnalysis.styleInfo.colorTemperature,
      recommendedBgColors: productAnalysis.styleInfo.backgroundCompatibility.recommendedColors
    });

    // Step 2: Generate banner background using both brand and product style info
    console.log('Step 2: Generating banner background with integrated style...');
    onProgress?.(15, 'Generando fondo optimizado para el producto...');

    const backgroundBanner = await generateBannerBackground(
      request.partnerName,
      productAnalysis.productDescription,
      request.styleAnalysis,
      productAnalysis.styleInfo,
      request.mainText,
      request.ctaText,
      request.discountPercentage,
      (fluxProgress, fluxStatus) => {
        // Map background progress to overall progress (15-35% range)
        const mappedProgress = 15 + (fluxProgress * 0.2);
        onProgress?.(mappedProgress, fluxStatus);
      }
    );

    console.log('Background generation completed:', backgroundBanner.imageUrl);

    // Step 3: Generate enhanced product cutout with Flux
    console.log('Step 3: Generating enhanced product image with Flux...');
    onProgress?.(35, 'Generando producto mejorado con IA...');

    const enhancedProduct = await generateProductCutout(
      request.productImageFile,
      productAnalysis.productDescription,
      (fluxProgress, fluxStatus) => {
        // Map product generation progress to overall progress (35-60% range)
        const mappedProgress = 35 + (fluxProgress * 0.25);
        onProgress?.(mappedProgress, fluxStatus);
      }
    );

    console.log('Enhanced product generation completed:', enhancedProduct.imageUrl);

    // Step 4: Convert enhanced product URL to File for background removal
    console.log('Step 4: Preparing enhanced product for background removal...');
    onProgress?.(60, 'Preparando producto mejorado...');

    // Use image proxy to fetch the enhanced product image (bypasses CORS)
    const proxyUrl = `/api/image-proxy?url=${encodeURIComponent(enhancedProduct.imageUrl)}`;
    console.log('🖼️ Using image proxy to fetch enhanced product:', proxyUrl);
    
    const enhancedImageResponse = await fetch(proxyUrl);
    if (!enhancedImageResponse.ok) {
      const errorText = await enhancedImageResponse.text().catch(() => 'Unknown error');
      console.error('Image proxy failed:', {
        status: enhancedImageResponse.status,
        statusText: enhancedImageResponse.statusText,
        error: errorText,
        originalUrl: enhancedProduct.imageUrl
      });
      throw new Error(`Failed to fetch enhanced product image: ${enhancedImageResponse.status} ${enhancedImageResponse.statusText}`);
    }
    
    const enhancedImageBlob = await enhancedImageResponse.blob();
    const enhancedImageFile = new File([enhancedImageBlob], 'enhanced-product.png', { type: 'image/png' });

    console.log('Enhanced product ready for background removal:', {
      originalSize: request.productImageFile.size,
      enhancedSize: enhancedImageFile.size,
      improvement: enhancedImageFile.size > request.productImageFile.size ? 'Enhanced' : 'Optimized'
    });

    // Step 5: Remove background from the ENHANCED product image
    console.log('Step 5: Removing background from enhanced product...');
    onProgress?.(65, 'Removiendo fondo del producto mejorado...');

    const productCutout = await removeProductBackground(
      enhancedImageFile, // ✅ Now using enhanced product instead of original
      (removalProgress, removalStatus) => {
        // Map removal progress to overall progress (65-85% range)
        const mappedProgress = 65 + (removalProgress * 0.2);
        onProgress?.(mappedProgress, removalStatus);
      }
    );

    console.log('Background removal completed on enhanced product. Final cutout ready.');
    console.log('Final product details:', {
      originalInputSize: request.productImageFile.size,
      enhancedSize: enhancedImageFile.size,
      finalCutoutSize: productCutout.processedSize,
      totalProcessingGain: `${Math.round((1 - productCutout.processedSize / request.productImageFile.size) * 100)}%`
    });

    // Step 6: Upload both images to Supabase storage
    console.log('Step 6: Uploading images to Supabase storage...');
    onProgress?.(85, 'Subiendo imágenes a almacenamiento...');

    // Import the simplified upload function
    const { uploadImageToStorageSimple } = await import('./banners-simple');
    
    const timestamp = Date.now();
    const backgroundFileName = `background-${request.partnerId}-${timestamp}.png`;
    const productFileName = `product-enhanced-${request.partnerId}-${timestamp}.png`;
    
    // Upload both images in parallel
    let backgroundStorageUrl: string;
    let productStorageUrl: string;
    
    try {
      [backgroundStorageUrl, productStorageUrl] = await Promise.all([
        uploadImageToStorageSimple(backgroundBanner.imageUrl, backgroundFileName, 'banners'),
        uploadImageToStorageSimple(productCutout.imageUrl, productFileName, 'banners')
      ]);
      
      console.log('Background uploaded to storage:', backgroundStorageUrl);
      console.log('Product uploaded to storage:', productStorageUrl);
      
      // Check if we're using temporary external URLs
      const usingTempUrls = backgroundStorageUrl.includes('delivery-') || productStorageUrl.includes('delivery-');
      
      if (usingTempUrls) {
        console.warn('⚠️ Using temporary external URLs - these will expire in ~1 hour');
        console.log('ℹ️ For permanent storage, the CORS proxy needs to be configured properly');
        
        // You could add a toast notification here if needed
        // toast({ title: "⚠️ Temporary Images", description: "Banner created with temporary image URLs that will expire in ~1 hour", variant: "default" });
      }
    } catch (storageError) {
      console.error('Storage upload failed:', storageError);
      
      // Provide specific error message if bucket doesn't exist
      const errorMessage = storageError instanceof Error ? storageError.message : String(storageError);
      if (errorMessage.includes('bucket') || errorMessage.includes('not found')) {
        throw new Error('El bucket "banners" no existe en Supabase. Por favor ejecuta el script SQL create_banners_bucket.sql en tu Supabase SQL Editor.');
      } else {
        throw new Error(`Error subiendo imágenes a almacenamiento: ${errorMessage}`);
      }
    }

    // Step 7: Save banner to database with both image URLs
    console.log('Step 7: Saving banner to database...');
    onProgress?.(90, 'Guardando banner en base de datos...');

    const bannerTitle = `Banner - ${request.partnerName} - ${new Date().toLocaleDateString()}`;

    const { data: bannerData, error: saveError } = await supabase
      .from('banners')
      .insert({
        partner_id: request.partnerId,
        image_url: backgroundStorageUrl, // Keep for backward compatibility
        background_image_url: backgroundStorageUrl,
        product_image_url: productStorageUrl,
        image_type: 'desktop',
        prompt_used: backgroundBanner.prompt, // Legacy field
        background_prompt: backgroundBanner.prompt,
        product_prompt: 'Automatic background removal applied',
        banner_title: bannerTitle,
        product_description: productAnalysis.productDescription,
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
      description: "Tu banner ha sido generado en 3 capas y guardado. Se abrirá el editor para agregar logo y elementos finales.",
    });

    return {
      bannerId: bannerData.id,
      backgroundImageUrl: backgroundStorageUrl,
      productImageUrl: productStorageUrl,
      productDescription: productAnalysis.productDescription
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
      } else if (errorMessage.includes('cors') || errorMessage.includes('access-control-allow-origin')) {
        userFriendlyMessage = 'Error de CORS resuelto - reintenta la generación del banner.';
      } else if (errorMessage.includes('image proxy') || errorMessage.includes('failed to fetch enhanced product')) {
        userFriendlyMessage = 'Error obteniendo imagen generada. La URL puede haber expirado - intenta de nuevo.';
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
 * Get banner data for editor (with 3-layer support)
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

    // Ensure backward compatibility for banners created with the old system
    if (!banner.background_image_url && banner.image_url) {
      banner.background_image_url = banner.image_url;
    }

    console.log('Banner data loaded for editor:', {
      id: banner.id,
      hasBackground: !!banner.background_image_url,
      hasProduct: !!banner.product_image_url,
      legacy: !!banner.image_url
    });

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

// Re-export background removal utilities for convenience
export { 
  preloadBackgroundRemovalAssets, 
  getPerformanceInfo, 
  validateImageForProcessing,
  isWebGPUSupported 
} from './background-removal'; 