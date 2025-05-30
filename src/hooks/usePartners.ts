
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
      const typedPartners = (data || []).map(partner => ({
        ...partner,
        status: (partner.status || 'active') as 'active' | 'pending' | 'inactive'
      }));
      
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

  useEffect(() => {
    fetchPartners();
  }, []);

  return {
    partners,
    isLoading,
    createPartner,
    fetchPartners,
  };
};
