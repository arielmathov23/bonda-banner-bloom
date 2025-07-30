import React, { useState, useEffect } from 'react';
import { Search, Download, Trash2, Calendar, Image as ImageIcon, Plus, X, Edit2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';

interface BannerHistoryItem {
  id: string;
  title: string;
  partner: string;
  createdAt: Date;
  imageUrl?: string;
  mobileUrl?: string;
  status: 'completed' | 'processing' | 'failed';
  dimensions: string;
  partnerId?: string;
  // Enhanced banner fields
  main_text?: string;
  description_text?: string;
  cta_text?: string;
  product_description?: string;
  discount_percentage?: number;
  image_url?: string;
  isEnhanced?: boolean;
}

interface BannerHistoryProps {
  partnerId?: string;
  partnerName?: string;
  onCreateBanner?: () => void;
  onEditBanner?: (banner: BannerHistoryItem) => void;
}

const BannerHistory = ({ partnerId, partnerName, onCreateBanner, onEditBanner }: BannerHistoryProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [banners, setBanners] = useState<BannerHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewingBanner, setViewingBanner] = useState<BannerHistoryItem | null>(null);
  
  // Load banners from database
  useEffect(() => {
    loadBanners();
    
    // Listen for banner save events to refresh the list
    const handleBannerSaved = () => {
      loadBanners();
    };
    
    window.addEventListener('bannerSaved', handleBannerSaved);
    return () => window.removeEventListener('bannerSaved', handleBannerSaved);
  }, [partnerId]);

  const loadBanners = async () => {
    try {
      setIsLoading(true);
      console.log('Loading banners from database...');
      console.log('Partner ID filter:', partnerId);
      
      // Import the getBanners function
      const { getBanners } = await import('@/lib/banners');
      
      // Load banners from database only
      const databaseBanners = await getBanners(partnerId);
      
      console.log('Raw database banners loaded:', databaseBanners);
      console.log('Number of banners found:', databaseBanners.length);
      
      // Convert to BannerHistoryItem format with enhanced data preservation
      const bannerItems: BannerHistoryItem[] = databaseBanners.map((banner: any) => ({
        id: banner.id,
        title: banner.banner_title || `Banner ${banner.id}`,
        partner: banner.partner_name || 'Unknown Partner',
        partnerId: banner.partner_id,
        createdAt: new Date(banner.created_at),
        status: 'completed' as const,
        dimensions: '1440x338', // Desktop banners
        // Primary image URL - supports 3-layer banners with fallback to legacy
        imageUrl: banner.background_image_url || banner.desktop_url || banner.image_url,
        mobileUrl: banner.mobile_url,
        // Enhanced banner data for editor
        main_text: banner.main_text,
        description_text: banner.description_text,
        cta_text: banner.cta_text,
        product_description: banner.product_description,
        discount_percentage: banner.discount_percentage,
        image_url: banner.image_url, // Keep original field
        isEnhanced: banner.isEnhanced || false
      }));

      console.log('Processed banner items:', bannerItems);
      console.log('Banner items with images:', bannerItems.filter(b => b.imageUrl));

      setBanners(bannerItems);
      
      if (bannerItems.length === 0) {
        console.log('No banners found in database - this could be because:');
        console.log('1. No banners have been saved yet');
        console.log('2. Database connection issue');
        console.log('3. Partner filter is too restrictive');
      } else {
        console.log(`Successfully loaded ${bannerItems.length} banners`);
      }
      
    } catch (error) {
      console.error('Error loading banners from database:', error);
      console.error('Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace'
      });
      
      // Set empty array on error
      setBanners([]);
      
      toast({
        title: "Error al cargar banners",
        description: "No se pudieron cargar los banners desde la base de datos. Verifica tu conexión.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredBanners = banners.filter(banner =>
    banner.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    banner.partner.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-brand-100 text-brand-700 border-brand-200';
      case 'processing':
        return 'bg-brand-50 text-brand-600 border-brand-100';
      case 'failed':
        return 'bg-brand-100 text-brand-800 border-brand-200';
      default:
        return 'bg-brand-100 text-brand-700 border-brand-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'completado';
      case 'processing':
        return 'procesando';
      case 'failed':
        return 'fallido';
      default:
        return status;
    }
  };



  const handleEditBanner = (banner: BannerHistoryItem) => {
    if (onEditBanner) {
      onEditBanner(banner);
    }
  };

  const handleDownloadBanner = async (banner: BannerHistoryItem) => {
    const imageUrl = banner.imageUrl;
    
    if (!imageUrl) {
      toast({
        title: "Error de descarga",
        description: "No se encontró la imagen del banner",
        variant: "destructive"
      });
      return;
    }

    try {
      // Fetch the image as a blob to avoid CORS issues
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const blob = await response.blob();
      
      // Create a blob URL for download
      const blobUrl = URL.createObjectURL(blob);
      
      // Create a temporary link element and trigger download
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `${banner.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_desktop.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the blob URL
      URL.revokeObjectURL(blobUrl);

      toast({
        title: "Descarga iniciada",
        description: `Banner Desktop descargado exitosamente`,
      });
    } catch (error) {
      console.error('Download failed:', error);
      toast({
        title: "Error de descarga",
        description: "No se pudo descargar el banner. Intenta nuevamente.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteBanner = async (bannerId: string) => {
    try {
      // Import the delete function
      const { deleteBanner } = await import('@/lib/banners');
      
      // Delete from database
      await deleteBanner(bannerId);
      
      // Remove from local state
      setBanners(prev => prev.filter(banner => banner.id !== bannerId));
      
      // Close view modal if viewing the deleted banner
      if (viewingBanner?.id === bannerId) {
        setViewingBanner(null);
      }

      toast({
        title: "Banner eliminado",
        description: "El banner ha sido eliminado permanentemente",
      });
    } catch (error) {
      console.error('Error deleting banner:', error);
      
        toast({
          title: "Error al eliminar",
          description: "No se pudo eliminar el banner. Por favor intenta nuevamente.",
          variant: "destructive"
        });
    }
  };

  return (
    <div className="space-y-6">
      {/* Create Banner Button for Partner View */}
      {partnerName && onCreateBanner && (
        <div className="flex justify-end">
          <Button 
            onClick={onCreateBanner}
            className="bg-brand-500 hover:bg-brand-600 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Crear Banner
          </Button>
      </div>
      )}

      {/* Search */}
      <Card className="bg-white border border-brand-100 shadow-sm">
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Buscar banners por título o socio..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white border-brand-200 focus:border-brand-500 h-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Banner Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          // Loading skeleton
          Array.from({ length: 6 }).map((_, index) => (
            <Card key={index} className="bg-white border border-brand-100 shadow-sm">
              <div className="aspect-video bg-gray-200 animate-pulse" />
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded animate-pulse" />
                  <div className="h-3 bg-gray-200 rounded w-2/3 animate-pulse" />
                  <div className="flex items-center space-x-3">
                    <div className="h-3 bg-gray-200 rounded w-1/3 animate-pulse" />
                    <div className="h-3 bg-gray-200 rounded w-1/4 animate-pulse" />
                  </div>
                  <div className="flex items-center space-x-2 pt-2">
                    <div className="h-8 bg-gray-200 rounded flex-1 animate-pulse" />
                    <div className="h-8 bg-gray-200 rounded flex-1 animate-pulse" />
                    <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : filteredBanners.length === 0 ? (
          <div className="col-span-full">
            <Card className="bg-white border border-brand-100 shadow-sm">
              <CardContent className="p-12 text-center">
                <div className="w-16 h-16 bg-brand-50 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <ImageIcon className="w-8 h-8 text-brand-300" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron banners</h3>
                <p className="text-gray-500 mb-4">
                  {searchTerm ? 'Ningún banner coincide con tus criterios de búsqueda' : 'Aún no has generado ningún banner'}
                </p>
                {!searchTerm && (
                  <p className="text-sm text-gray-400">Comienza a crear banners para verlos aquí</p>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          filteredBanners.map((banner) => (
            <Card key={banner.id} className="bg-white border border-brand-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="aspect-video bg-brand-50 relative">
                {banner.imageUrl ? (
                  <img 
                    src={banner.imageUrl} 
                    alt={banner.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      console.error('Failed to load banner image:', banner.imageUrl, e);
                      // Try to use mobile URL as fallback
                      if (banner.mobileUrl && banner.mobileUrl !== banner.imageUrl) {
                        (e.target as HTMLImageElement).src = banner.mobileUrl;
                      }
                    }}
                    onLoad={() => {
                      console.log('Successfully loaded banner image:', banner.imageUrl);
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="w-12 h-12 text-brand-300" />
                    <div className="absolute bottom-2 left-2 text-xs text-gray-500 bg-white px-2 py-1 rounded">
                      No image URL
                    </div>
                  </div>
                )}
                <div className="absolute top-3 right-3">
                  <Badge className={getStatusColor(banner.status)}>
                    {getStatusText(banner.status)}
                  </Badge>
                </div>
              </div>
              
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div>
                    <h3 className="font-medium text-gray-900 text-sm truncate">
                      {banner.title}
                    </h3>
                    <p className="text-xs text-gray-600">{banner.partner}</p>
                  </div>
                  
                  <div className="flex items-center text-xs text-gray-500 space-x-3">
                    <div className="flex items-center">
                      <Calendar className="w-3 h-3 mr-1" />
                      {banner.createdAt.toLocaleDateString()}
                    </div>
                    <span>{banner.dimensions}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2 pt-2">
                    {banner.status === 'completed' && onEditBanner && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1 h-8 text-xs border-violet-200 hover:bg-violet-50 text-violet-600"
                        onClick={() => handleEditBanner(banner)}
                      >
                        <Edit2 className="w-3 h-3 mr-1" />
                        Editar
                      </Button>
                    )}
                    {banner.status === 'completed' && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1 h-8 text-xs border-brand-200 hover:bg-brand-50 text-brand-600"
                        onClick={() => handleDownloadBanner(banner)}
                      >
                        <Download className="w-3 h-3 mr-1" />
                        Descargar
                      </Button>
                    )}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-8 w-8 p-0 border-brand-200 hover:bg-brand-50"
                      onClick={() => handleDeleteBanner(banner.id)}
                    >
                      <Trash2 className="w-3 h-3 text-gray-600" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Banner View Modal */}
      <Dialog open={!!viewingBanner} onOpenChange={() => setViewingBanner(null)}>
        <DialogContent className="max-w-6xl max-h-[90vh] p-0">
          {viewingBanner && (
            <>
              <DialogHeader className="p-6 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <DialogTitle className="text-xl font-semibold text-gray-700">
                      {viewingBanner.title}
                    </DialogTitle>
                    <p className="text-sm text-gray-600 mt-1">{viewingBanner.partner}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => handleDownloadBanner(viewingBanner)}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                      size="sm"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Descargar Escritorio
                    </Button>
                  </div>
                </div>
              </DialogHeader>
              
              <div className="px-6 pb-6">
                    <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 min-h-[400px] flex items-center justify-center">
                      <img
                        src={viewingBanner.imageUrl}
                        alt={viewingBanner.title}
                        className="w-full rounded-lg border border-gray-200 shadow-sm max-h-[500px] object-contain"
                      />
                    </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BannerHistory;
