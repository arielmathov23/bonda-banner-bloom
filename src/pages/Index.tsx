
import React, { useState } from 'react';
import { Users, Image, History, ArrowRight, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PartnerCreationForm from '@/components/PartnerCreationForm';
import BannerGeneration from '@/components/BannerGeneration';
import PartnerList from '@/components/PartnerList';
import BannerHistory from '@/components/BannerHistory';
import { usePartners } from '@/hooks/usePartners';

const Index = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { partners } = usePartners();

  // Mock recent banners data
  const recentBanners = [
    {
      id: '1',
      title: 'Summer Sale Campaign',
      partner: 'Partner A',
      createdAt: new Date(2024, 4, 25),
      thumbnail: '/placeholder.svg'
    },
    {
      id: '2',
      title: 'Black Friday Promotion',
      partner: 'Partner B',
      createdAt: new Date(2024, 4, 24),
      thumbnail: '/placeholder.svg'
    },
    {
      id: '3',
      title: 'Holiday Special',
      partner: 'Partner C',
      createdAt: new Date(2024, 4, 23),
      thumbnail: '/placeholder.svg'
    }
  ];

  const stats = [
    { title: 'Total Partners', value: partners.length.toString(), icon: Users },
    { title: 'Generated Banners', value: '12', icon: Image },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
                <Image className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Bonda Banner Generation
                </h1>
                <p className="text-xs text-gray-500">powered by panchito</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="grid w-full grid-cols-4 bg-white p-1 rounded-lg shadow-sm border border-gray-200">
            <TabsTrigger 
              value="dashboard" 
              className="rounded-md data-[state=active]:bg-gray-900 data-[state=active]:text-white font-medium"
            >
              Dashboard
            </TabsTrigger>
            <TabsTrigger 
              value="banners" 
              className="rounded-md data-[state=active]:bg-gray-900 data-[state=active]:text-white font-medium"
            >
              Generate Banners
            </TabsTrigger>
            <TabsTrigger 
              value="history" 
              className="rounded-md data-[state=active]:bg-gray-900 data-[state=active]:text-white font-medium"
            >
              Banner History
            </TabsTrigger>
            <TabsTrigger 
              value="partners" 
              className="rounded-md data-[state=active]:bg-gray-900 data-[state=active]:text-white font-medium"
            >
              Partners
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {stats.map((stat, index) => (
                <Card key={index} className="bg-white border border-gray-200 shadow-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                        <p className="text-3xl font-semibold text-gray-900">{stat.value}</p>
                      </div>
                      <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                        <stat.icon className="w-6 h-6 text-gray-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Quick Action */}
            <Card className="bg-white border border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-gray-900">Quick Action</CardTitle>
                <CardDescription className="text-gray-600">Start creating your banner</CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => setActiveTab('banners')}
                  className="bg-gray-900 hover:bg-gray-800 text-white"
                  size="lg"
                >
                  Generate Banner
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>

            {/* Recent Banners Preview */}
            <Card className="bg-white border border-gray-200 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-semibold text-gray-900">Recent Banners</CardTitle>
                  <CardDescription className="text-gray-600">Your latest banner creations</CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => setActiveTab('history')}
                  className="border-gray-200 text-gray-600 hover:bg-gray-50"
                >
                  View All
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {recentBanners.map((banner) => (
                    <div 
                      key={banner.id} 
                      className="group cursor-pointer p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                      onClick={() => setActiveTab('history')}
                    >
                      <div className="aspect-video bg-gray-100 rounded-md mb-3 flex items-center justify-center">
                        <Image className="w-8 h-8 text-gray-400" />
                      </div>
                      <h4 className="font-medium text-gray-900 text-sm truncate">{banner.title}</h4>
                      <p className="text-xs text-gray-500 mt-1">{banner.partner}</p>
                      <div className="flex items-center text-xs text-gray-400 mt-2">
                        <Calendar className="w-3 h-3 mr-1" />
                        {banner.createdAt.toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="banners">
            <BannerGeneration />
          </TabsContent>

          <TabsContent value="history">
            <BannerHistory />
          </TabsContent>

          <TabsContent value="partners">
            <div className="space-y-8">
              {/* Add Partner */}
              <Card className="bg-white border border-gray-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-xl font-semibold text-gray-900">Add New Partner</CardTitle>
                  <CardDescription className="text-gray-600">Create a new business partnership</CardDescription>
                </CardHeader>
                <CardContent>
                  <PartnerCreationForm />
                </CardContent>
              </Card>

              {/* Partners List */}
              <Card className="bg-white border border-gray-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-xl font-semibold text-gray-900">Manage Partners</CardTitle>
                  <CardDescription className="text-gray-600">View and edit your existing partners</CardDescription>
                </CardHeader>
                <CardContent>
                  <PartnerList />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
