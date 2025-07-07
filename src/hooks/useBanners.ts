import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface Banner {
  id: string;
  partner_id: string;
  banner_title: string | null;
  image_url: string;
  image_type: string;
  prompt_used: string | null;
  created_at: string;
}

export const useBanners = () => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchBanners = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('banners')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setBanners(data || []);
    } catch (error) {
      console.error('Error fetching banners:', error);
      toast({
        title: "Error fetching banners",
        description: "Could not load banners from database",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getBannersByPartner = (partnerId: string) => {
    return banners.filter(banner => banner.partner_id === partnerId);
  };

  const getRecentBanners = (limit: number = 3) => {
    return banners.slice(0, limit);
  };

  const getTotalBanners = () => {
    return banners.length;
  };

  const getPartnerBannerCount = (partnerId: string) => {
    return banners.filter(banner => banner.partner_id === partnerId).length;
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  return {
    banners,
    isLoading,
    fetchBanners,
    getBannersByPartner,
    getRecentBanners,
    getTotalBanners,
    getPartnerBannerCount,
  };
}; 