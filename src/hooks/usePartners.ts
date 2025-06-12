import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

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
        // Temporarily parse product photos from reference_banners_urls
        const allBanners = partner.reference_banners_urls || [];
        const referenceBanners = allBanners.filter(url => !url.startsWith('PRODUCT:'));
        const productPhotos = allBanners
          .filter(url => url.startsWith('PRODUCT:'))
          .map(url => url.replace('PRODUCT:', ''));

        return {
          ...partner,
          status: (partner.status || 'active') as 'active' | 'pending' | 'inactive',
          reference_banners_urls: referenceBanners,
          product_photos_urls: productPhotos,
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
      
      console.log('Uploading file:', fileName);
      
      const { error: uploadError } = await supabase.storage
        .from('partner-assets')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('partner-assets')
        .getPublicUrl(fileName);

      console.log('File uploaded successfully:', data.publicUrl);
      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
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

      // Temporarily store product photos in reference_banners_urls with prefix
      const allReferenceBanners = [
        ...referenceBannersUrls,
        ...productPhotosUrls.map(url => `PRODUCT:${url}`)
      ];

      // Insert partner into database
      const insertData = {
        name: partnerData.name,
        regions: partnerData.regions,
        partner_url: partnerData.partner_url || null,
        benefits_description: partnerData.benefits_description || null,
        description: partnerData.description || null,
        logo_url: logoUrl,
        brand_manual_url: brandManualUrl,
        reference_banners_urls: allReferenceBanners,
        // Temporarily comment out until column is added
        // product_photos_urls: productPhotosUrls,
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
      
      // Parse existing banners to separate reference banners from product photos
      const existingAllBanners = existingPartner.reference_banners_urls || [];
      const existingReferenceBanners = existingAllBanners.filter(url => !url.startsWith('PRODUCT:'));
      const existingProductPhotosFromBanners = existingAllBanners
        .filter(url => url.startsWith('PRODUCT:'))
        .map(url => url.replace('PRODUCT:', ''));
      
      let referenceBannersUrls = partnerData.existingReferenceBanners !== undefined 
        ? partnerData.existingReferenceBanners 
        : existingReferenceBanners;
      let productPhotosUrls = partnerData.existingProductPhotos !== undefined
        ? partnerData.existingProductPhotos
        : existingProductPhotosFromBanners;

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

      // Temporarily store product photos in reference_banners_urls with prefix
      const allReferenceBanners = [
        ...referenceBannersUrls,
        ...productPhotosUrls.map(url => `PRODUCT:${url}`)
      ];

      // Update partner in database
      const updateData = {
        name: partnerData.name,
        regions: partnerData.regions,
        partner_url: partnerData.partner_url || null,
        benefits_description: partnerData.benefits_description || null,
        description: partnerData.description || null,
        logo_url: logoUrl,
        brand_manual_url: brandManualUrl,
        reference_banners_urls: allReferenceBanners,
        // Temporarily comment out until column is added
        // product_photos_urls: productPhotosUrls,
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
