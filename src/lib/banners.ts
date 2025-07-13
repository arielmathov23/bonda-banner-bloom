import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import { loadImageWithProxy } from '@/lib/cors-helper';

type BannerRow = Database['public']['Tables']['banners']['Row'];
type BannerInsert = Database['public']['Tables']['banners']['Insert'];

export interface SaveBannerData {
  partnerId: string;
  desktopImageUrl: string;
  mobileImageUrl: string;
  promptUsed?: string;
  bannerTitle?: string;
}

/**
 * Upload an image to Supabase Storage and return the public URL
 * Handles CORS-blocked URLs (like Flux CDN) using canvas conversion
 */
export async function uploadImageToStorage(
  imageUrl: string,
  fileName: string,
  bucketName: string = 'banners'
): Promise<string> {
  try {
    console.log('Uploading image to storage:', imageUrl);
    
    let imageBlob: Blob;
    
    // Check if this is a CORS-blocked URL (like Flux delivery URLs)
    const isExternalUrl = imageUrl.includes('delivery-eu1.bfl.ai') || 
                         imageUrl.includes('delivery-us1.bfl.ai') || 
                         imageUrl.includes('bfl.ai') ||
                         imageUrl.includes('openai.com') ||
                         !imageUrl.includes(window.location.hostname);
    
    if (isExternalUrl) {
      console.log('Detected external URL, using proxy with canvas conversion...');
      
      try {
        // Use the CORS helper to load the image via proxy
        const img = await loadImageWithProxy(imageUrl);
        
        // Convert to canvas and then to blob
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          throw new Error('Could not create canvas context');
        }
        
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        // Convert canvas to blob
        imageBlob = await new Promise((resolve, reject) => {
          canvas.toBlob((blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to convert canvas to blob'));
            }
          }, 'image/png', 0.95);
        });
        
        console.log('Successfully converted external image to blob via canvas');
      } catch (canvasError) {
        console.warn('Canvas conversion failed, trying direct proxy fetch:', canvasError);
        
        // Fallback to direct proxy fetch
        try {
          const proxyUrl = `/api/image-proxy?url=${encodeURIComponent(imageUrl)}`;
          const response = await fetch(proxyUrl);
          if (!response.ok) {
            throw new Error(`Proxy fetch failed: ${response.statusText}`);
          }
          imageBlob = await response.blob();
          console.log('Successfully fetched image via direct proxy');
        } catch (proxyError) {
          console.error('Both canvas and proxy methods failed:', proxyError);
          throw new Error(`Failed to fetch image from external source: ${proxyError.message}`);
        }
      }
    } else {
      // For non-CORS URLs, use direct fetch
      console.log('Using direct fetch for non-CORS URL');
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
      }
      imageBlob = await response.blob();
    }
    
    console.log('Image blob created, size:', imageBlob.size, 'bytes');
    
    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(fileName, imageBlob, {
        contentType: imageBlob.type || 'image/png',
        upsert: true
      });

    if (error) {
      console.error('Error uploading image to Supabase:', error);
      throw error;
    }

    // Get the public URL
    const { data: publicUrlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(data.path);

    console.log('Image uploaded successfully to:', publicUrlData.publicUrl);
    return publicUrlData.publicUrl;
  } catch (error) {
    console.error('Error in uploadImageToStorage:', error);
    console.error('Failed URL:', imageUrl);
    throw error;
  }
}

/**
 * Save a generated banner to Supabase with persistent image storage
 * This will create two records: one for desktop and one for mobile
 */
export async function saveBannerToDatabase(bannerData: SaveBannerData): Promise<{ desktop: BannerRow, mobile: BannerRow }> {
  try {
    console.log('Starting saveBannerToDatabase with data:', bannerData);
    
    // Validate required fields
    if (!bannerData.partnerId) {
      throw new Error('Partner ID is required');
    }
    if (!bannerData.desktopImageUrl) {
      throw new Error('Desktop image URL is required');
    }
    if (!bannerData.mobileImageUrl) {
      throw new Error('Mobile image URL is required');
    }

    // Generate unique filenames
    const timestamp = Date.now();
    const desktopFileName = `banner-desktop-${timestamp}.png`;
    const mobileFileName = `banner-mobile-${timestamp}.png`;

    console.log('Generated filenames:', { desktopFileName, mobileFileName });

    // Upload images to Supabase Storage
    console.log('Uploading images to Supabase Storage...');
    const [desktopStorageUrl, mobileStorageUrl] = await Promise.all([
      uploadImageToStorage(bannerData.desktopImageUrl, desktopFileName),
      uploadImageToStorage(bannerData.mobileImageUrl, mobileFileName)
    ]);

    console.log('Images uploaded successfully:', { desktopStorageUrl, mobileStorageUrl });

    // Create the banner records - one for desktop, one for mobile
    const desktopBannerInsert: BannerInsert = {
      partner_id: bannerData.partnerId,
      image_url: desktopStorageUrl,
      image_type: 'desktop',
      prompt_used: bannerData.promptUsed || null,
      banner_title: bannerData.bannerTitle || null
    };

    const mobileBannerInsert: BannerInsert = {
      partner_id: bannerData.partnerId,
      image_url: mobileStorageUrl,
      image_type: 'mobile',
      prompt_used: bannerData.promptUsed || null,
      banner_title: bannerData.bannerTitle || null
    };

    console.log('Prepared banner inserts:', { desktopBannerInsert, mobileBannerInsert });

    // Insert both banner records
    console.log('Inserting banner records to database...');
    const [desktopResult, mobileResult] = await Promise.all([
      supabase.from('banners').insert(desktopBannerInsert).select().single(),
      supabase.from('banners').insert(mobileBannerInsert).select().single()
    ]);

    if (desktopResult.error) {
      console.error('Error saving desktop banner to database:', desktopResult.error);
      console.error('Desktop banner data that failed:', desktopBannerInsert);
      throw new Error(`Desktop banner save failed: ${desktopResult.error.message}`);
    }

    if (mobileResult.error) {
      console.error('Error saving mobile banner to database:', mobileResult.error);
      console.error('Mobile banner data that failed:', mobileBannerInsert);
      throw new Error(`Mobile banner save failed: ${mobileResult.error.message}`);
    }

    console.log('Banners saved successfully to database');
    console.log('Desktop result:', desktopResult.data);
    console.log('Mobile result:', mobileResult.data);
    
    return { 
      desktop: desktopResult.data, 
      mobile: mobileResult.data 
    };
  } catch (error) {
    console.error('Error in saveBannerToDatabase:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace',
      bannerData
    });
    throw error;
  }
}

/**
 * Get all banners, optionally filtered by partner
 * Handles both old desktop/mobile pairs and new enhanced single records
 */
export async function getBanners(partnerId?: string): Promise<any[]> {
  try {
    let query = supabase
      .from('banners')
      .select(`
        *,
        partners:partner_id (
          name,
          logo_url
        )
      `)
      .order('created_at', { ascending: false });

    if (partnerId) {
      query = query.eq('partner_id', partnerId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching banners:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Separate enhanced banners (single records) from old paired banners
    const enhancedBanners = data.filter((banner: any) => 
      banner.main_text !== null || banner.description_text !== null || banner.cta_text !== null
    );
    
    const oldBanners = data.filter((banner: any) => 
      banner.main_text === null && banner.description_text === null && banner.cta_text === null
    );

    const results: any[] = [];

    // Process enhanced banners (single records)
    enhancedBanners.forEach((banner: any) => {
      results.push({
        id: banner.id,
        partner_id: banner.partner_id,
        partner_name: banner.partners?.name || 'Unknown',
        created_at: banner.created_at,
        prompt_used: banner.prompt_used,
        banner_title: banner.banner_title,
        // Map enhanced banner fields
        main_text: banner.main_text,
        description_text: banner.description_text,
        cta_text: banner.cta_text,
        product_description: banner.product_description,
        discount_percentage: banner.discount_percentage,
        // Use image_url directly for enhanced banners
        desktop_url: banner.image_url,
        mobile_url: banner.image_url, // Same image for both
        image_url: banner.image_url,  // Keep original field too
        image_type: banner.image_type,
        // Enhanced banner metadata
        isEnhanced: true
      });
    });

    // Process old banners (desktop/mobile pairs) - keep existing grouping logic
    if (oldBanners.length > 0) {
      const groupedBanners = new Map();
      
      oldBanners.forEach((banner: any) => {
        const timestamp = new Date(banner.created_at).getTime();
        const key = `${banner.partner_id}_${Math.floor(timestamp / 60000)}`; // Group by minute
        
        if (!groupedBanners.has(key)) {
          groupedBanners.set(key, {
            id: banner.id,
            partner_id: banner.partner_id,
            partner_name: banner.partners?.name || 'Unknown',
            created_at: banner.created_at,
            prompt_used: banner.prompt_used,
            banner_title: banner.banner_title,
            desktop_url: null,
            mobile_url: null,
            image_url: null,
            isEnhanced: false
          });
        }
        
        const group = groupedBanners.get(key);
        if (banner.image_type === 'desktop') {
          group.desktop_url = banner.image_url;
          group.image_url = banner.image_url; // Set primary image URL
          group.id = banner.id; // Use desktop banner ID as primary
        } else if (banner.image_type === 'mobile') {
          group.mobile_url = banner.image_url;
        }
      });

      // Add old grouped banners to results
      results.push(...Array.from(groupedBanners.values()).filter(group => group.desktop_url || group.mobile_url));
    }

    // Sort all results by creation date (newest first)
    results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    console.log('getBanners results:', {
      total: results.length,
      enhanced: enhancedBanners.length,
      oldPaired: oldBanners.length,
      results: results.map(r => ({
        id: r.id,
        title: r.banner_title,
        isEnhanced: r.isEnhanced,
        hasDesktop: !!r.desktop_url,
        hasMobile: !!r.mobile_url,
        imageUrl: r.image_url
      }))
    });

    return results;
  } catch (error) {
    console.error('Error in getBanners:', error);
    throw error;
  }
}

/**
 * Get a single banner by ID
 */
export async function getBannerById(bannerId: string): Promise<BannerRow | null> {
  try {
    const { data, error } = await supabase
      .from('banners')
      .select(`
        *,
        partners:partner_id (
          name,
          logo_url
        )
      `)
      .eq('id', bannerId)
      .single();

    if (error) {
      console.error('Error fetching banner:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in getBannerById:', error);
    throw error;
  }
}

/**
 * Delete a banner and its associated images
 * This will delete both desktop and mobile versions if they share the same timestamp
 */
export async function deleteBanner(bannerId: string): Promise<void> {
  try {
    // First get the banner to get the image URL and find related banners
    const banner = await getBannerById(bannerId);
    if (!banner) {
      throw new Error('Banner not found');
    }

    // Find all banners from the same generation session (same minute)
    const timestamp = new Date(banner.created_at).getTime();
    const timeWindow = 60000; // 1 minute
    
    const { data: relatedBanners, error: fetchError } = await supabase
      .from('banners')
      .select('*')
      .eq('partner_id', banner.partner_id)
      .gte('created_at', new Date(timestamp - timeWindow).toISOString())
      .lte('created_at', new Date(timestamp + timeWindow).toISOString());

    if (fetchError) {
      console.error('Error fetching related banners:', fetchError);
      throw fetchError;
    }

    // Delete images from storage
    for (const relatedBanner of relatedBanners || []) {
      const imagePath = relatedBanner.image_url.split('/').pop();
      if (imagePath) {
        await supabase.storage.from('banners').remove([imagePath]);
      }
    }

    // Delete all related banner records
    const bannerIds = relatedBanners?.map(b => b.id) || [bannerId];
    const { error: deleteError } = await supabase
      .from('banners')
      .delete()
      .in('id', bannerIds);

    if (deleteError) {
      console.error('Error deleting banners:', deleteError);
      throw deleteError;
    }

    console.log('Banners deleted successfully:', bannerIds);
  } catch (error) {
    console.error('Error in deleteBanner:', error);
    throw error;
  }
} 