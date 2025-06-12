import React, { useState } from 'react';
import { Search, Download, Eye, Trash2, Calendar, Image as ImageIcon, Plus } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface BannerHistoryItem {
  id: string;
  title: string;
  partner: string;
  createdAt: Date;
  imageUrl?: string;
  status: 'completed' | 'processing' | 'failed';
  dimensions: string;
  partnerId?: string;
}

interface BannerHistoryProps {
  partnerId?: string;
  partnerName?: string;
  onCreateBanner?: () => void;
}

const BannerHistory = ({ partnerId, partnerName, onCreateBanner }: BannerHistoryProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Get saved banners from localStorage
  const getSavedBanners = () => {
    try {
      const saved = localStorage.getItem('savedBanners');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  };

  const [savedBanners] = useState(() => getSavedBanners());
  
  // Convert saved banners to BannerHistoryItem format and filter by partner if specified
  const allBanners: BannerHistoryItem[] = savedBanners.map((banner: any) => ({
    id: banner.id,
    title: banner.selectedOption?.copy || `Banner ${banner.id}`,
    partner: banner.partnerName,
    partnerId: banner.partnerId,
    createdAt: new Date(banner.createdAt),
    status: 'completed' as const,
    dimensions: '1792x1024',
    imageUrl: banner.selectedOption?.desktopUrl
  }));

  // Filter by partner if partnerId is provided
  const banners = partnerId 
    ? allBanners.filter(banner => (banner as any).partnerId === partnerId)
    : allBanners;

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
        {filteredBanners.length === 0 ? (
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
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="w-12 h-12 text-brand-300" />
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
                    <Button variant="outline" size="sm" className="flex-1 h-8 text-xs border-brand-200 hover:bg-brand-50 text-brand-600">
                      <Eye className="w-3 h-3 mr-1" />
                      Ver
                    </Button>
                    {banner.status === 'completed' && (
                      <Button variant="outline" size="sm" className="flex-1 h-8 text-xs border-brand-200 hover:bg-brand-50 text-brand-600">
                        <Download className="w-3 h-3 mr-1" />
                        Descargar
                      </Button>
                    )}
                    <Button variant="outline" size="sm" className="h-8 w-8 p-0 border-brand-200 hover:bg-brand-50">
                      <Trash2 className="w-3 h-3 text-gray-600" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default BannerHistory;
