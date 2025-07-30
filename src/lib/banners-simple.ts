import { supabase } from '@/integrations/supabase/client';

/**
 * Simplified image upload that handles external URLs with better error handling
 */
export async function uploadImageToStorageSimple(
  imageUrl: string,
  fileName: string,
  bucketName: string = 'banners'  
): Promise<string> {
  try {
    console.log('🚀 [SIMPLE] Starting image upload:', { imageUrl, fileName, bucketName });
    
    let imageBlob: Blob;
    
    // Check if this is an external URL that might have CORS issues
    const isExternalUrl = imageUrl.includes('delivery-eu1.bfl.ai') || 
                         imageUrl.includes('delivery-us1.bfl.ai') || 
                         imageUrl.includes('bfl.ai') ||
                         imageUrl.includes('openai.com');
    
    if (isExternalUrl) {
      console.log('🌐 [SIMPLE] Handling external URL via server proxy...');
      
      // Use the Vite dev server proxy to fetch the image
      try {
        const proxyUrl = `/api/image-proxy?url=${encodeURIComponent(imageUrl)}`;
        console.log('🔗 [SIMPLE] Using proxy URL:', proxyUrl);
        
        const response = await fetch(proxyUrl, {
          headers: {
            'Accept': 'image/png,image/jpeg,image/*,*/*',
          }
        });
        
        console.log('📡 [SIMPLE] Proxy response:', {
          status: response.status,
          statusText: response.statusText,
          contentType: response.headers.get('content-type'),
          contentLength: response.headers.get('content-length')
        });
        
        if (!response.ok) {
          throw new Error(`Proxy fetch failed: ${response.status} ${response.statusText}`);
        }
        
        const contentType = response.headers.get('content-type');
        if (!contentType?.startsWith('image/')) {
          console.error('❌ [SIMPLE] Proxy returned non-image content:', contentType);
          
          // Try to read the response as text to see what we got
          try {
            const text = await response.text();
            console.error('🔍 [SIMPLE] Response content preview:', text.substring(0, 300));
            
            if (text.includes('ENOTFOUND') || text.includes('ECONNREFUSED')) {
              throw new Error('Network connection failed - check your internet connection');
            } else if (text.includes('404') || text.includes('not found')) {
              throw new Error('Image URL not found - it may have expired');
            } else if (text.includes('403') || text.includes('forbidden')) {
              throw new Error('Access denied to image URL');
            } else {
              throw new Error('Proxy returned HTML/text instead of image data');
            }
          } catch (readError) {
            throw new Error('Proxy returned invalid response format');
          }
        }
        
        imageBlob = await response.blob();
        console.log('✅ [SIMPLE] Successfully fetched via proxy:', {
          type: imageBlob.type,
          size: imageBlob.size
        });
        
      } catch (proxyError) {
        console.error('❌ [SIMPLE] Proxy method failed:', proxyError);
        
        // Try the Vite dev server proxy first, then fallback to external proxies
        const corsProxies = [
          `/api/image-proxy?url=${encodeURIComponent(imageUrl)}`, // Our Vite proxy
          `https://api.allorigins.win/raw?url=${encodeURIComponent(imageUrl)}`,
          `https://corsproxy.io/?${encodeURIComponent(imageUrl)}`,
          `https://proxy.cors.sh/${imageUrl}`
        ];
        
        let lastError: Error | null = null;
        
        for (const corsProxy of corsProxies) {
          try {
            console.log('🔄 [SIMPLE] Trying CORS proxy:', corsProxy);
            
            const corsResponse = await fetch(corsProxy, {
              headers: {
                'Accept': 'image/png,image/jpeg,image/*,*/*',
                'User-Agent': 'Mozilla/5.0 (compatible; BannerApp/1.0)'
              }
            });
            
            console.log('📡 [SIMPLE] CORS proxy response:', {
              status: corsResponse.status,
              contentType: corsResponse.headers.get('content-type'),
              size: corsResponse.headers.get('content-length')
            });
            
            if (corsResponse.ok) {
              const testBlob = await corsResponse.blob();
              
              // Validate that we got actual image data
              if (testBlob.size < 1000) {
                throw new Error('Response too small to be a valid image');
              }
              
              // Try to validate it's actually an image by creating an image element
              const testImg = new Image();
              const testUrl = URL.createObjectURL(testBlob);
              
              await new Promise((resolve, reject) => {
                testImg.onload = () => {
                  URL.revokeObjectURL(testUrl);
                  resolve(true);
                };
                testImg.onerror = () => {
                  URL.revokeObjectURL(testUrl);
                  reject(new Error('Invalid image data'));
                };
                testImg.src = testUrl;
              });
              
              imageBlob = testBlob;
              console.log('✅ [SIMPLE] CORS proxy successful:', corsProxy);
              break;
              
            } else {
              throw new Error(`CORS proxy returned ${corsResponse.status}`);
            }
            
          } catch (corsError) {
            console.warn('⚠️ [SIMPLE] CORS proxy failed:', corsProxy, corsError.message);
            lastError = corsError as Error;
            continue;
          }
        }
        
        if (!imageBlob) {
          console.error('❌ [SIMPLE] All CORS proxies failed');
          console.log('🔄 [SIMPLE] Using external URL directly as final fallback...');
          
          // FINAL FALLBACK: Return the external URL directly
          // This allows the system to work even when all proxies fail
          // Note: These URLs will expire in ~1 hour (which is normal for Flux)
          
          console.log('⚠️ [SIMPLE] Using external URL directly:', imageUrl);
          console.log('ℹ️ [SIMPLE] Banner will work but images may expire after ~1 hour');
          
          return imageUrl; // Return the external URL directly - system will still work!
        }
      }
      
    } else {
      // For local/non-CORS URLs, use direct fetch
      console.log('🏠 [SIMPLE] Using direct fetch for local URL...');
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
      }
      imageBlob = await response.blob();
    }
    
    // Validate blob
    console.log('🔍 [SIMPLE] Validating blob:', {
      type: imageBlob.type,
      size: imageBlob.size,
      isValidSize: imageBlob.size > 1000 // At least 1KB
    });
    
    if (imageBlob.size < 1000) {
      throw new Error('Image appears to be too small or corrupted');
    }
    
    // Ensure proper content type
    const contentType = imageBlob.type || 'image/png';
    if (!contentType.startsWith('image/')) {
      console.warn('⚠️ [SIMPLE] Fixing content type from:', contentType);
      imageBlob = new Blob([imageBlob], { type: 'image/png' });
    }
    
    // Upload to Supabase (with fallback for missing bucket)
    console.log('📤 [SIMPLE] Uploading to Supabase...');
    
    try {
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(fileName, imageBlob, {
          contentType: imageBlob.type,
          upsert: true
        });

      if (error) {
        // Check if it's a bucket-related error
        if (error.message.includes('bucket') || error.message.includes('not found') || error.message.includes('does not exist')) {
          console.warn('⚠️ [SIMPLE] Bucket not found, using external URL fallback');
          throw new Error('BUCKET_NOT_FOUND');
        } else {
          console.error('❌ [SIMPLE] Supabase upload error:', error);
          throw error;
        }
      }

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(data.path);

      console.log('✅ [SIMPLE] Upload complete:', publicUrlData.publicUrl);
      return publicUrlData.publicUrl;
      
    } catch (uploadError) {
      if (uploadError.message === 'BUCKET_NOT_FOUND') {
        console.log('🔄 [SIMPLE] Bucket not available, returning external URL directly...');
        console.log('ℹ️ [SIMPLE] This will work but images may expire in ~1 hour');
        
        // Return the external URL directly - the system will still work!
        return imageUrl;
      } else {
        throw uploadError;
      }
    }
    
  } catch (error) {
    console.error('❌ [SIMPLE] Upload failed:', error);
    throw error;
  }
}

/**
 * Load an image as an HTML image element (works around some CORS issues)
 */
function loadImageAsElement(imageUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    // Don't set crossOrigin initially - let the browser handle it
    img.onload = () => {
      console.log('🖼️ [SIMPLE] Image loaded successfully:', { width: img.width, height: img.height });
      resolve(img);
    };
    
    img.onerror = (error) => {
      console.warn('⚠️ [SIMPLE] Initial image load failed, trying with crossOrigin...');
      
      // Try again with crossOrigin
      const imgCors = new Image();
      imgCors.crossOrigin = 'anonymous';
      
      imgCors.onload = () => {
        console.log('🖼️ [SIMPLE] Image loaded with CORS:', { width: imgCors.width, height: imgCors.height });
        resolve(imgCors);
      };
      
      imgCors.onerror = () => {
        reject(new Error('Failed to load image with both methods'));
      };
      
      imgCors.src = imageUrl;
    };
    
    // Set timeout
    setTimeout(() => {
      reject(new Error('Image load timeout'));
    }, 30000);
    
    img.src = imageUrl; 
  });
}

/**
 * Convert an HTML image element to a Blob
 */
function convertImageToBlob(img: HTMLImageElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      reject(new Error('Cannot create canvas context'));
      return;
    }
    
    canvas.width = img.width;
    canvas.height = img.height;
    
    try {
      ctx.drawImage(img, 0, 0);
      
      canvas.toBlob((blob) => {
        if (blob) {
          console.log('🎨 [SIMPLE] Canvas to blob conversion successful:', {
            type: blob.type,
            size: blob.size
          });
          resolve(blob);
        } else {
          reject(new Error('Canvas to blob conversion failed'));
        }
      }, 'image/png', 0.95);
      
    } catch (error) {
      reject(new Error(`Canvas drawing failed: ${error}`));
    }
  });
} 