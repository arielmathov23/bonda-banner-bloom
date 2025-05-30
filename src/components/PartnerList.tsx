
import React, { useState } from 'react';
import { Search, MoreHorizontal, MapPin, Globe, Mail, Users } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { usePartners } from '@/hooks/usePartners';

const PartnerList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const { partners, isLoading } = usePartners();

  const regionLabels: Record<string, string> = {
    'argentina-uruguay': 'Argentina & Uruguay',
    'latam': 'LATAM',
  };

  const filteredPartners = partners.filter(partner =>
    partner.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    partner.regions.some(region => 
      regionLabels[region]?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'inactive':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatRegions = (regions: string[]) => {
    return regions.map(region => regionLabels[region] || region).join(', ');
  };

  if (isLoading) {
    return (
      <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-gray-900">Partner Directory</CardTitle>
          <CardDescription>Loading partners...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-gray-900">Partner Directory</CardTitle>
        <CardDescription>Manage your existing partners ({partners.length} total)</CardDescription>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search partners..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white/50 border-gray-200 focus:border-blue-500"
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {partners.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No partners yet</h3>
              <p className="text-gray-500 mb-4">Create your first partner to get started with banner generation</p>
              <p className="text-sm text-gray-400">Use the form on the left to add a new partner</p>
            </div>
          ) : filteredPartners.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No partners found matching your search</p>
            </div>
          ) : (
            filteredPartners.map((partner) => (
              <div
                key={partner.id}
                className="bg-white/50 rounded-lg p-4 border border-gray-200 hover:shadow-md transition-all duration-200 hover:scale-[1.02]"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <Avatar className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600">
                      {partner.logo_url ? (
                        <AvatarImage src={partner.logo_url} alt={partner.name} />
                      ) : null}
                      <AvatarFallback className="text-white font-semibold">
                        {getInitials(partner.name)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 truncate">
                          {partner.name}
                        </h3>
                        <Badge className={getStatusColor(partner.status)}>
                          {partner.status}
                        </Badge>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex items-center text-sm text-gray-600">
                          <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                          {formatRegions(partner.regions)}
                        </div>
                        
                        {partner.partner_url && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Globe className="w-4 h-4 mr-2 text-gray-400" />
                            <a 
                              href={partner.partner_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="hover:text-blue-600 truncate"
                            >
                              {partner.partner_url}
                            </a>
                          </div>
                        )}

                        {partner.benefits_description && (
                          <div className="text-sm text-gray-600 mt-2">
                            <p className="line-clamp-2">{partner.benefits_description}</p>
                          </div>
                        )}
                      </div>
                      
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          Created {new Date(partner.created_at).toLocaleDateString()}
                        </span>
                        
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PartnerList;
