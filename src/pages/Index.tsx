
import React, { useState } from 'react';
import { Users, Image, Sparkles, History, Plus } from 'lucide-react';
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

  const stats = [
    { title: 'Total Partners', value: partners.length.toString(), icon: Users, color: 'from-blue-500 to-cyan-500' },
    { title: 'Generated Banners', value: '0', icon: Image, color: 'from-green-500 to-emerald-500' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-xl border-b border-gray-200/50 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 rounded-2xl flex items-center justify-center shadow-lg">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  Bonda Banner Generation
                </h1>
                <p className="text-sm text-gray-600 font-medium">powered by panchito</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="grid w-full grid-cols-4 bg-white/70 backdrop-blur-sm p-1.5 rounded-2xl shadow-lg border border-gray-200/50">
            <TabsTrigger 
              value="dashboard" 
              className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-md font-medium transition-all duration-200"
            >
              Dashboard
            </TabsTrigger>
            <TabsTrigger 
              value="banners" 
              className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-md font-medium transition-all duration-200"
            >
              Generate Banners
            </TabsTrigger>
            <TabsTrigger 
              value="history" 
              className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-md font-medium transition-all duration-200"
            >
              Banner History
            </TabsTrigger>
            <TabsTrigger 
              value="partners" 
              className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-md font-medium transition-all duration-200"
            >
              Partners
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {stats.map((stat, index) => (
                <Card key={index} className="bg-white/70 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 rounded-2xl">
                  <CardContent className="p-8">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">{stat.title}</p>
                        <p className="text-4xl font-bold text-gray-900">{stat.value}</p>
                      </div>
                      <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${stat.color} flex items-center justify-center shadow-lg`}>
                        <stat.icon className="w-8 h-8 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Quick Actions - Only Generate Banner */}
            <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
              <CardHeader className="pb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-bold text-gray-900">Quick Action</CardTitle>
                    <CardDescription className="text-gray-600 font-medium">Get started with banner creation</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pb-8">
                <div className="flex justify-center">
                  <Button 
                    onClick={() => setActiveTab('banners')}
                    variant="outline" 
                    className="h-40 w-80 flex-col bg-gradient-to-br from-green-50 via-green-100 to-emerald-100 border-green-200/50 hover:from-green-100 hover:to-emerald-200 transition-all duration-300 rounded-2xl shadow-md hover:shadow-lg group"
                    size="lg"
                  >
                    <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200">
                      <Image className="w-8 h-8 text-white" />
                    </div>
                    <span className="text-green-700 font-bold text-xl mb-2">Generate Banner</span>
                    <span className="text-green-600 text-sm text-center">Create AI-powered marketing banners</span>
                  </Button>
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
              {/* Add Partner Action */}
              <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                        <Plus className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-xl font-bold text-gray-900">Add New Partner</CardTitle>
                        <CardDescription className="text-gray-600 font-medium">Create a new business partnership</CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <PartnerCreationForm />
                </CardContent>
              </Card>

              {/* Partners List */}
              <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
                      <Users className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold text-gray-900">Manage Partners</CardTitle>
                      <CardDescription className="text-gray-600 font-medium">View and edit your existing partners</CardDescription>
                    </div>
                  </div>
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
