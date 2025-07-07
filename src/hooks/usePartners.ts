import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { StyleAnalysis } from '@/lib/style-analysis';

export interface Partner {
  id: string;
  name: string;
  regions: string[];
  partner_url?: string;
  benefits_description?: string;
  description?: string;
  logo_url?: string;
  brand_manual_url?: string;
  reference_banners_urls?: string[];
  product_photos_urls?: string[];
  reference_style_analysis?: StyleAnalysis;
  status: 'active' | 'pending' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface CreatePartnerData {
  name: string;
  regions: string[];
  partner_url?: string;
  benefits_description?: string;
  description?: string;
  logo?: File;
  brand_manual?: File;
  reference_banners?: File[];
  product_photos?: File[];
  reference_style_analysis?: StyleAnalysis;
}

export interface UpdatePartnerData extends CreatePartnerData {
  id: string;
  existingLogo?: string | null;
  existingReferenceBanners?: string[];
  existingProductPhotos?: string[];
}

export const usePartners = () => {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchPartners = async () => {
    console.log('Fetching partners from database...');
    try {
      const { data, error } = await supabase
        .from('partners')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      console.log('Fetched partners data:', data);
      
      // Type cast the data to ensure status is properly typed
      const typedPartners = (data || []).map(partner => {
        return {
          ...partner,
          status: (partner.status || 'active') as 'active' | 'pending' | 'inactive',
          reference_banners_urls: partner.reference_banners_urls || [],
          product_photos_urls: partner.product_photos_urls || [],
          reference_style_analysis: partner.reference_style_analysis as unknown as StyleAnalysis | undefined,
        };
      });
      
      console.log('Setting partners state with:', typedPartners);
      setPartners(typedPartners);
    } catch (error) {
      console.error('Error fetching partners:', error);
      toast({
        title: "Error fetching partners",
        description: "Could not load partners from database",
        variant: "destructive",
      });
    }
  };

  const uploadFile = async (file: File, folder: string): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${folder}/${Date.now()}-${Math.random()}.${fileExt}`;
      
      console.log('Uploading file:', fileName, 'Size:', file.size, 'Type:', file.type);
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('partner-assets')
        .upload(fileName, file);

      if (uploadError) {
        console.error('Upload error details:', {
          message: uploadError.message,
          name: uploadError.name,
          stack: uploadError.stack,
          error: uploadError
        });
        throw uploadError;
      }

      console.log('Upload successful, data:', uploadData);

      const { data: urlData } = supabase.storage
        .from('partner-assets')
        .getPublicUrl(fileName);

      console.log('File uploaded successfully:', urlData.publicUrl);
      
      // Test if the URL is accessible
      try {
        const response = await fetch(urlData.publicUrl, { method: 'HEAD' });
        console.log('URL accessibility test:', response.status, response.statusText);
      } catch (fetchError) {
        console.warn('URL accessibility test failed:', fetchError);
      }
      
      return urlData.publicUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      console.error('File details:', { name: file.name, size: file.size, type: file.type });
      
      toast({
        title: "Error uploading file",
        description: `Failed to upload ${file.name}: ${error}`,
        variant: "destructive",
      });
      
      return null;
    }
  };

  const createPartner = async (partnerData: CreatePartnerData): Promise<boolean> => {
    setIsLoading(true);
    console.log('Creating partner with data:', partnerData);
    
    try {
      let logoUrl = null;
      let brandManualUrl = null;
      let referenceBannersUrls: string[] = [];
      let productPhotosUrls: string[] = [];

      // Upload logo if provided
      if (partnerData.logo) {
        logoUrl = await uploadFile(partnerData.logo, 'logos');
        console.log('Logo uploaded:', logoUrl);
      }

      // Upload brand manual if provided
      if (partnerData.brand_manual) {
        brandManualUrl = await uploadFile(partnerData.brand_manual, 'brand-manuals');
        console.log('Brand manual uploaded:', brandManualUrl);
      }

      // Upload reference banners if provided
      if (partnerData.reference_banners && partnerData.reference_banners.length > 0) {
        const uploadPromises = partnerData.reference_banners.map(file => 
          uploadFile(file, 'reference-banners')
        );
        const results = await Promise.all(uploadPromises);
        referenceBannersUrls = results.filter(url => url !== null) as string[];
        console.log('Reference banners uploaded:', referenceBannersUrls);
      }

      // Upload product photos if provided
      if (partnerData.product_photos && partnerData.product_photos.length > 0) {
        const uploadPromises = partnerData.product_photos.map(file => 
          uploadFile(file, 'product-photos')
        );
        const results = await Promise.all(uploadPromises);
        productPhotosUrls = results.filter(url => url !== null) as string[];
        console.log('Product photos uploaded:', productPhotosUrls);
      }

      // Insert partner into database
      const insertData = {
        name: partnerData.name,
        regions: partnerData.regions,
        partner_url: partnerData.partner_url || null,
        benefits_description: partnerData.benefits_description || null,
        description: partnerData.description || null,
        logo_url: logoUrl,
        brand_manual_url: brandManualUrl,
        reference_banners_urls: referenceBannersUrls,
        product_photos_urls: productPhotosUrls,
        reference_style_analysis: partnerData.reference_style_analysis as unknown as any || null,
      };

      console.log('Inserting partner with data:', insertData);

      const { data: insertedData, error } = await supabase
        .from('partners')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;

      console.log('Partner created successfully:', insertedData);

      toast({
        title: "Partner created successfully!",
        description: `${partnerData.name} has been added to your partner list`,
      });

      // Refresh partners list immediately
      await fetchPartners();
      return true;
    } catch (error) {
      console.error('Error creating partner:', error);
      toast({
        title: "Error creating partner",
        description: "Please try again later",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const updatePartner = async (partnerData: UpdatePartnerData): Promise<boolean> => {
    setIsLoading(true);
    console.log('Updating partner with data:', partnerData);
    
    try {
      const existingPartner = partners.find(p => p.id === partnerData.id);
      if (!existingPartner) {
        throw new Error('Partner not found');
      }

      // Start with existing URLs, or use what's being preserved
      let logoUrl = partnerData.existingLogo !== undefined ? partnerData.existingLogo : existingPartner.logo_url;
      let brandManualUrl = existingPartner.brand_manual_url;
      
      // Use existing URLs directly from the separate columns
      let referenceBannersUrls = partnerData.existingReferenceBanners !== undefined 
        ? partnerData.existingReferenceBanners 
        : existingPartner.reference_banners_urls || [];
      let productPhotosUrls = partnerData.existingProductPhotos !== undefined
        ? partnerData.existingProductPhotos
        : existingPartner.product_photos_urls || [];

      // Upload new logo if provided
      if (partnerData.logo) {
        logoUrl = await uploadFile(partnerData.logo, 'logos');
        console.log('New logo uploaded:', logoUrl);
      }

      // Upload new brand manual if provided
      if (partnerData.brand_manual) {
        brandManualUrl = await uploadFile(partnerData.brand_manual, 'brand-manuals');
        console.log('New brand manual uploaded:', brandManualUrl);
      }

      // Upload new reference banners if provided and add to existing ones
      if (partnerData.reference_banners && partnerData.reference_banners.length > 0) {
        const uploadPromises = partnerData.reference_banners.map(file => 
          uploadFile(file, 'reference-banners')
        );
        const results = await Promise.all(uploadPromises);
        const newUrls = results.filter(url => url !== null) as string[];
        referenceBannersUrls = [...referenceBannersUrls, ...newUrls];
        console.log('New reference banners uploaded:', newUrls);
      }

      // Upload new product photos if provided and add to existing ones
      if (partnerData.product_photos && partnerData.product_photos.length > 0) {
        const uploadPromises = partnerData.product_photos.map(file => 
          uploadFile(file, 'product-photos')
        );
        const results = await Promise.all(uploadPromises);
        const newUrls = results.filter(url => url !== null) as string[];
        productPhotosUrls = [...productPhotosUrls, ...newUrls];
        console.log('New product photos uploaded:', newUrls);
      }

      // Update partner in database
      const updateData = {
        name: partnerData.name,
        regions: partnerData.regions,
        partner_url: partnerData.partner_url || null,
        benefits_description: partnerData.benefits_description || null,
        description: partnerData.description || null,
        logo_url: logoUrl,
        brand_manual_url: brandManualUrl,
        reference_banners_urls: referenceBannersUrls,
        product_photos_urls: productPhotosUrls,
        reference_style_analysis: partnerData.reference_style_analysis as unknown as any || null,
        updated_at: new Date().toISOString(),
      };

      console.log('Updating partner with data:', updateData);

      const { data: updatedData, error } = await supabase
        .from('partners')
        .update(updateData)
        .eq('id', partnerData.id)
        .select()
        .single();

      if (error) throw error;

      console.log('Partner updated successfully:', updatedData);

      toast({
        title: "Partner updated successfully!",
        description: `${partnerData.name} has been updated`,
      });

      // Refresh partners list immediately
      await fetchPartners();
      return true;
    } catch (error) {
      console.error('Error updating partner:', error);
      toast({
        title: "Error updating partner",
        description: "Please try again later",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const deletePartner = async (partnerId: string): Promise<boolean> => {
    setIsLoading(true);
    console.log('Deleting partner with id:', partnerId);
    
    try {
      const { error } = await supabase
        .from('partners')
        .delete()
        .eq('id', partnerId);

      if (error) throw error;

      console.log('Partner deleted successfully');

      toast({
        title: "Partner deleted successfully!",
        description: "The partner has been removed from your list",
      });

      // Refresh partners list immediately
      await fetchPartners();
      return true;
    } catch (error) {
      console.error('Error deleting partner:', error);
      toast({
        title: "Error deleting partner",
        description: "Please try again later",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPartners();
  }, []);

  return {
    partners,
    isLoading,
    createPartner,
    updatePartner,
    deletePartner,
    fetchPartners,
  };
};
