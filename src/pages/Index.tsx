
import React, { useState } from 'react';
import { Plus, Users, Image, Link, FileText, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PartnerCreationForm from '@/components/PartnerCreationForm';
import CopyInputSelection from '@/components/CopyInputSelection';
import BannerGeneration from '@/components/BannerGeneration';
import BenefitURLStorage from '@/components/BenefitURLStorage';
import PartnerList from '@/components/PartnerList';

const Index = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const stats = [
    { title: 'Total Partners', value: '24', icon: Users, color: 'bg-blue-500' },
    { title: 'Generated Banners', value: '156', icon: Image, color: 'bg-green-500' },
    { title: 'Active Benefits', value: '89', icon: Link, color: 'bg-purple-500' },
    { title: 'Brand Manuals', value: '18', icon: FileText, color: 'bg-orange-500' },
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
            <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300">
              <Plus className="w-4 h-4 mr-2" />
              Quick Actions
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-white/60 backdrop-blur-sm p-1 rounded-xl shadow-sm">
            <TabsTrigger value="dashboard" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="partners" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
              Partners
            </TabsTrigger>
            <TabsTrigger value="copy" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
              Copy Input
            </TabsTrigger>
            <TabsTrigger value="banners" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
              Banners
            </TabsTrigger>
            <TabsTrigger value="benefits" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
              Benefits
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                <CardDescription>Get started with common tasks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Button 
                    onClick={() => setActiveTab('partners')}
                    variant="outline" 
                    className="h-24 flex-col bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:from-blue-100 hover:to-blue-200 transition-all duration-300"
                  >
                    <Users className="w-6 h-6 mb-2 text-blue-600" />
                    <span className="text-blue-700 font-medium">New Partner</span>
                  </Button>
                  <Button 
                    onClick={() => setActiveTab('banners')}
                    variant="outline" 
                    className="h-24 flex-col bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:from-green-100 hover:to-green-200 transition-all duration-300"
                  >
                    <Image className="w-6 h-6 mb-2 text-green-600" />
                    <span className="text-green-700 font-medium">Generate Banner</span>
                  </Button>
                  <Button 
                    onClick={() => setActiveTab('copy')}
                    variant="outline" 
                    className="h-24 flex-col bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:from-purple-100 hover:to-purple-200 transition-all duration-300"
                  >
                    <FileText className="w-6 h-6 mb-2 text-purple-600" />
                    <span className="text-purple-700 font-medium">Manage Copy</span>
                  </Button>
                  <Button 
                    onClick={() => setActiveTab('benefits')}
                    variant="outline" 
                    className="h-24 flex-col bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 hover:from-orange-100 hover:to-orange-200 transition-all duration-300"
                  >
                    <Link className="w-6 h-6 mb-2 text-orange-600" />
                    <span className="text-orange-700 font-medium">Add Benefits</span>
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

          <TabsContent value="copy">
            <CopyInputSelection />
          </TabsContent>

          <TabsContent value="banners">
            <BannerGeneration />
          </TabsContent>

          <TabsContent value="benefits">
            <BenefitURLStorage />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
