import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface ProductPhoto {
  id: string;
  url: string;
  fileName: string;
  uploadedAt: string;
}

/**
 * Upload a single product photo to a partner's collection
 */
export async function uploadProductPhoto(
  partnerId: string, 
  file: File,
  onProgress?: (progress: number) => void
): Promise<string | null> {
  try {
    onProgress?.(10);
    
    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `product-photos/${partnerId}/${Date.now()}-${Math.random()}.${fileExt}`;
    
    console.log('Uploading product photo:', fileName, 'Size:', file.size, 'Type:', file.type);
    onProgress?.(30);
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('partner-assets')
      .upload(fileName, file);

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw uploadError;
    }

    console.log('Upload successful:', uploadData);
    onProgress?.(60);

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('partner-assets')
      .getPublicUrl(fileName);

    console.log('Generated public URL:', urlData.publicUrl);
    onProgress?.(80);

    // Get current partner data
    const { data: partnerData, error: fetchError } = await supabase
      .from('partners')
      .select('product_photos_urls')
      .eq('id', partnerId)
      .single();

    if (fetchError) {
      console.error('Error fetching partner:', fetchError);
      throw fetchError;
    }

    // Add new photo URL to existing array
    const currentPhotos = partnerData.product_photos_urls || [];
    const updatedPhotos = [...currentPhotos, urlData.publicUrl];

    // Update partner with new photo URL
    const { error: updateError } = await supabase
      .from('partners')
      .update({ 
        product_photos_urls: updatedPhotos,
        updated_at: new Date().toISOString()
      })
      .eq('id', partnerId);

    if (updateError) {
      console.error('Error updating partner:', updateError);
      throw updateError;
    }

    console.log('Product photo added successfully to partner');
    onProgress?.(100);

    // Test URL accessibility
    try {
      const response = await fetch(urlData.publicUrl, { method: 'HEAD' });
      console.log('URL accessibility test:', response.status, response.statusText);
    } catch (fetchError) {
      console.warn('URL accessibility test failed:', fetchError);
    }

    return urlData.publicUrl;
  } catch (error) {
    console.error('Error uploading product photo:', error);
    toast({
      title: "Error subiendo foto",
      description: `No se pudo subir la foto: ${error}`,
      variant: "destructive",
    });
    return null;
  }
}

/**
 * Get all product photos for a specific partner
 */
export async function getPartnerProductPhotos(partnerId: string): Promise<ProductPhoto[]> {
  try {
    const { data: partnerData, error } = await supabase
      .from('partners')
      .select('product_photos_urls')
      .eq('id', partnerId)
      .single();

    if (error) {
      console.error('Error fetching partner photos:', error);
      throw error;
    }

    if (!partnerData.product_photos_urls) {
      return [];
    }

    // Convert URLs to ProductPhoto objects
    return partnerData.product_photos_urls.map((url, index) => ({
      id: `${partnerId}-${index}`,
      url,
      fileName: url.split('/').pop() || `photo-${index}`,
      uploadedAt: new Date().toISOString() // We don't have actual upload dates
    }));
  } catch (error) {
    console.error('Error getting partner product photos:', error);
    return [];
  }
}

/**
 * Remove a product photo from a partner's collection
 */
export async function removeProductPhoto(
  partnerId: string, 
  photoUrl: string
): Promise<boolean> {
  try {
    // Get current partner data
    const { data: partnerData, error: fetchError } = await supabase
      .from('partners')
      .select('product_photos_urls')
      .eq('id', partnerId)
      .single();

    if (fetchError) {
      console.error('Error fetching partner:', fetchError);
      throw fetchError;
    }

    if (!partnerData.product_photos_urls) {
      return false;
    }

    // Remove photo URL from array
    const updatedPhotos = partnerData.product_photos_urls.filter(url => url !== photoUrl);

    // Update partner
    const { error: updateError } = await supabase
      .from('partners')
      .update({ 
        product_photos_urls: updatedPhotos,
        updated_at: new Date().toISOString()
      })
      .eq('id', partnerId);

    if (updateError) {
      console.error('Error updating partner:', updateError);
      throw updateError;
    }

    // Try to delete the file from storage (optional - files will be cleaned up later)
    try {
      const filePath = photoUrl.split('/').slice(-3).join('/'); // Extract path after domain
      await supabase.storage
        .from('partner-assets')
        .remove([filePath]);
      console.log('File deleted from storage:', filePath);
    } catch (storageError) {
      console.warn('Could not delete file from storage:', storageError);
      // Don't throw error here, just log it
    }

    console.log('Product photo removed successfully');
    return true;
  } catch (error) {
    console.error('Error removing product photo:', error);
    toast({
      title: "Error eliminando foto",
      description: `No se pudo eliminar la foto: ${error}`,
      variant: "destructive",
    });
    return false;
  }
}

/**
 * Get partner data with product photos
 */
export async function getPartnerWithPhotos(partnerId: string) {
  try {
    const { data: partnerData, error } = await supabase
      .from('partners')
      .select('*')
      .eq('id', partnerId)
      .single();

    if (error) {
      console.error('Error fetching partner:', error);
      throw error;
    }

    return partnerData;
  } catch (error) {
    console.error('Error getting partner with photos:', error);
    throw error;
  }
} 