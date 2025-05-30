
import React, { useState } from 'react';
import { Users, Image, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PartnerCreationForm from '@/components/PartnerCreationForm';
import BannerGeneration from '@/components/BannerGeneration';
import PartnerList from '@/components/PartnerList';
import { usePartners } from '@/hooks/usePartners';

const Index = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { partners } = usePartners();

  const stats = [
    { title: 'Total Partners', value: partners.length.toString(), icon: Users, color: 'bg-blue-500' },
    { title: 'Generated Banners', value: '0', icon: Image, color: 'bg-green-500' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Bonda Backoffice</h1>
                <p className="text-sm text-gray-500">Partner Management Platform</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-white/60 backdrop-blur-sm p-1 rounded-xl shadow-sm">
            <TabsTrigger value="dashboard" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="partners" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
              Partners
            </TabsTrigger>
            <TabsTrigger value="banners" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
              Generate Banners
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {stats.map((stat, index) => (
                <Card key={index} className="bg-white/60 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                        <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                      </div>
                      <div className={`w-12 h-12 rounded-xl ${stat.color} flex items-center justify-center`}>
                        <stat.icon className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Quick Actions */}
            <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-gray-900">Quick Actions</CardTitle>
                <CardDescription>Start with the essentials</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Button 
                    onClick={() => setActiveTab('partners')}
                    variant="outline" 
                    className="h-32 flex-col bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:from-blue-100 hover:to-blue-200 transition-all duration-300"
                    size="lg"
                  >
                    <Users className="w-8 h-8 mb-3 text-blue-600" />
                    <span className="text-blue-700 font-medium text-lg">Manage Partners</span>
                    <span className="text-blue-600 text-sm">Create or list partners</span>
                  </Button>
                  <Button 
                    onClick={() => setActiveTab('banners')}
                    variant="outline" 
                    className="h-32 flex-col bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:from-green-100 hover:to-green-200 transition-all duration-300"
                    size="lg"
                  >
                    <Image className="w-8 h-8 mb-3 text-green-600" />
                    <span className="text-green-700 font-medium text-lg">Generate Banners</span>
                    <span className="text-green-600 text-sm">Create AI-powered banners</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="partners">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <PartnerCreationForm />
              <PartnerList />
            </div>
          </TabsContent>

          <TabsContent value="banners">
            <BannerGeneration />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
