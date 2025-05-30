
import React, { useState } from 'react';
import { Search, Download, Eye, Trash2, Calendar, Image as ImageIcon } from 'lucide-react';
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
}

const BannerHistory = () => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const [banners] = useState<BannerHistoryItem[]>([
    {
      id: '1',
      title: 'Summer Sale Campaign',
      partner: 'Partner A',
      createdAt: new Date(2024, 4, 25),
      status: 'completed',
      dimensions: '1200x628',
      imageUrl: '/placeholder.svg'
    },
    {
      id: '2',
      title: 'Black Friday Promotion',
      partner: 'Partner B',
      createdAt: new Date(2024, 4, 24),
      status: 'completed',
      dimensions: '800x600',
      imageUrl: '/placeholder.svg'
    },
    {
      id: '3',
      title: 'Holiday Special',
      partner: 'Partner C',
      createdAt: new Date(2024, 4, 23),
      status: 'processing',
      dimensions: '1080x1080'
    }
  ]);

  const filteredBanners = banners.filter(banner =>
    banner.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    banner.partner.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'processing':
        return 'bg-gray-50 text-gray-600 border-gray-100';
      case 'failed':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">Banner History</h2>
        <p className="text-gray-600 mt-1">View and manage your previously generated banners</p>
      </div>

      {/* Search */}
      <Card className="bg-white border border-gray-200 shadow-sm">
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search banners by title or partner..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white border-gray-200 focus:border-gray-900 h-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Banner Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBanners.length === 0 ? (
          <div className="col-span-full">
            <Card className="bg-white border border-gray-200 shadow-sm">
              <CardContent className="p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <ImageIcon className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No banners found</h3>
                <p className="text-gray-500 mb-4">
                  {searchTerm ? 'No banners match your search criteria' : 'You haven\'t generated any banners yet'}
                </p>
                {!searchTerm && (
                  <p className="text-sm text-gray-400">Start creating banners to see them here</p>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          filteredBanners.map((banner) => (
            <Card key={banner.id} className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="aspect-video bg-gray-100 relative">
                {banner.imageUrl ? (
                  <img 
                    src={banner.imageUrl} 
                    alt={banner.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="w-12 h-12 text-gray-400" />
                  </div>
                )}
                <div className="absolute top-3 right-3">
                  <Badge className={getStatusColor(banner.status)}>
                    {banner.status}
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
                    <Button variant="outline" size="sm" className="flex-1 h-8 text-xs border-gray-200 hover:bg-gray-50">
                      <Eye className="w-3 h-3 mr-1" />
                      View
                    </Button>
                    {banner.status === 'completed' && (
                      <Button variant="outline" size="sm" className="flex-1 h-8 text-xs border-gray-200 hover:bg-gray-50">
                        <Download className="w-3 h-3 mr-1" />
                        Download
                      </Button>
                    )}
                    <Button variant="outline" size="sm" className="h-8 w-8 p-0 border-gray-200 hover:bg-gray-50">
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
