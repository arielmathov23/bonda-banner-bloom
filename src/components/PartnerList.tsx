
import React, { useState } from 'react';
import { Search, MoreHorizontal, MapPin, Globe, Mail } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface Partner {
  id: string;
  name: string;
  region: string;
  industry: string;
  status: 'active' | 'pending' | 'inactive';
  email: string;
  website: string;
  joinDate: string;
}

const PartnerList = () => {
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data
  const partners: Partner[] = [
    {
      id: '1',
      name: 'TechCorp Solutions',
      region: 'North America',
      industry: 'Technology',
      status: 'active',
      email: 'contact@techcorp.com',
      website: 'www.techcorp.com',
      joinDate: '2024-01-15'
    },
    {
      id: '2',
      name: 'Global Finance Ltd',
      region: 'Europe',
      industry: 'Finance',
      status: 'active',
      email: 'info@globalfinance.com',
      website: 'www.globalfinance.com',
      joinDate: '2024-02-20'
    },
    {
      id: '3',
      name: 'HealthFirst Medical',
      region: 'Asia Pacific',
      industry: 'Healthcare',
      status: 'pending',
      email: 'admin@healthfirst.com',
      website: 'www.healthfirst.com',
      joinDate: '2024-03-10'
    },
    {
      id: '4',
      name: 'EduTech Innovations',
      region: 'North America',
      industry: 'Education',
      status: 'active',
      email: 'hello@edutech.com',
      website: 'www.edutech.com',
      joinDate: '2024-02-28'
    }
  ];

  const filteredPartners = partners.filter(partner =>
    partner.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    partner.region.toLowerCase().includes(searchTerm.toLowerCase()) ||
    partner.industry.toLowerCase().includes(searchTerm.toLowerCase())
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

  return (
    <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-gray-900">Partner Directory</CardTitle>
        <CardDescription>Manage your existing partners</CardDescription>
        
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
          {filteredPartners.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No partners found</p>
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
                          {partner.region} • {partner.industry}
                        </div>
                        
                        <div className="flex items-center text-sm text-gray-600">
                          <Mail className="w-4 h-4 mr-2 text-gray-400" />
                          {partner.email}
                        </div>
                        
                        <div className="flex items-center text-sm text-gray-600">
                          <Globe className="w-4 h-4 mr-2 text-gray-400" />
                          {partner.website}
                        </div>
                      </div>
                      
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          Joined {new Date(partner.joinDate).toLocaleDateString()}
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
