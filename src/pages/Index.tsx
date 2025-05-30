
import React, { useState } from 'react';
import { Users, Image, History, Home, Plus, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import PartnerCreationForm from '@/components/PartnerCreationForm';
import BannerGeneration from '@/components/BannerGeneration';
import PartnerList from '@/components/PartnerList';
import BannerHistory from '@/components/BannerHistory';
import { usePartners } from '@/hooks/usePartners';

const Index = () => {
  const [activeSection, setActiveSection] = useState('home');
  const { partners } = usePartners();

  // Mock recent banners data
  const recentBanners = [
    {
      id: '1',
      title: 'Campaña de Rebajas de Verano',
      partner: 'Socio A',
      createdAt: new Date(2024, 4, 25),
      thumbnail: '/placeholder.svg'
    },
    {
      id: '2',
      title: 'Promoción Black Friday',
      partner: 'Socio B',
      createdAt: new Date(2024, 4, 24),
      thumbnail: '/placeholder.svg'
    },
    {
      id: '3',
      title: 'Especial de Navidad',
      partner: 'Socio C',
      createdAt: new Date(2024, 4, 23),
      thumbnail: '/placeholder.svg'
    }
  ];

  const stats = [
    { title: 'Socios Totales', value: partners.length.toString(), icon: Users },
    { title: 'Banners Generados', value: '12', icon: Image },
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'home':
        return (
          <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {stats.map((stat, index) => (
                <Card key={index} className="bg-white border border-brand-100 shadow-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                        <p className="text-3xl font-semibold text-gray-900">{stat.value}</p>
                      </div>
                      <div className="w-12 h-12 rounded-lg bg-brand-50 flex items-center justify-center">
                        <stat.icon className="w-6 h-6 text-brand-500" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Quick Action */}
            <Card className="bg-white border border-brand-100 shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-gray-900">Acción Rápida</CardTitle>
                <CardDescription className="text-gray-600">Comienza a crear tu banner</CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => setActiveSection('create-banner')}
                  className="bg-brand-500 hover:bg-brand-600 text-white"
                >
                  Generar Banner
                </Button>
              </CardContent>
            </Card>

            {/* Recent Banners Preview */}
            <Card className="bg-white border border-brand-100 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-semibold text-gray-900">Banners Recientes</CardTitle>
                  <CardDescription className="text-gray-600">Tus últimas creaciones de banners</CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => setActiveSection('banner-list')}
                  className="border-brand-200 text-brand-600 hover:bg-brand-50"
                >
                  Ver Todos
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {recentBanners.map((banner) => (
                    <div 
                      key={banner.id} 
                      className="group cursor-pointer p-4 rounded-lg border border-brand-100 hover:border-brand-300 transition-colors"
                      onClick={() => setActiveSection('banner-list')}
                    >
                      <div className="aspect-video bg-brand-50 rounded-md mb-3 flex items-center justify-center">
                        <Image className="w-8 h-8 text-brand-300" />
                      </div>
                      <h4 className="font-medium text-gray-900 text-sm truncate">{banner.title}</h4>
                      <p className="text-xs text-gray-500 mt-1">{banner.partner}</p>
                      <div className="flex items-center text-xs text-gray-400 mt-2">
                        <History className="w-3 h-3 mr-1" />
                        {banner.createdAt.toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'partners':
        return (
          <div className="space-y-8">
            {/* Partners List */}
            <Card className="bg-white border border-brand-100 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-semibold text-gray-900">Directorio de Socios</CardTitle>
                  <CardDescription className="text-gray-600">Gestiona tus asociaciones comerciales</CardDescription>
                </div>
                <Button 
                  onClick={() => setActiveSection('create-partner')}
                  className="bg-brand-500 hover:bg-brand-600 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Crear Socio
                </Button>
              </CardHeader>
              <CardContent>
                <PartnerList />
              </CardContent>
            </Card>
          </div>
        );

      case 'create-partner':
        return (
          <Card className="bg-white border border-brand-100 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-gray-900">Agregar Nuevo Socio</CardTitle>
              <CardDescription className="text-gray-600">Crear una nueva asociación comercial</CardDescription>
            </CardHeader>
            <CardContent>
              <PartnerCreationForm />
            </CardContent>
          </Card>
        );

      case 'banner-list':
        return <BannerHistory />;

      case 'create-banner':
        return <BannerGeneration />;

      default:
        return null;
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-brand-25 flex flex-col w-full">
        <div className="flex flex-1">
          <AppSidebar activeSection={activeSection} setActiveSection={setActiveSection} />
          
          <div className="flex-1 flex flex-col">
            {/* Header */}
            <header className="bg-white border-b border-brand-100 sticky top-0 z-50">
              <div className="px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                  <div className="flex items-center space-x-3">
                    <SidebarTrigger />
                    <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
                      <Image className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h1 className="text-xl font-semibold text-gray-900">
                        Generación de Banners Bonda
                      </h1>
                    </div>
                  </div>
                </div>
              </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 p-6 lg:p-8">
              {renderContent()}
            </main>
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-white border-t border-brand-100 py-4 px-6 lg:px-8">
          <div className="flex justify-center">
            <a 
              href="https://www.panchito.xyz/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium text-white bg-gradient-to-r from-green-400 to-green-600 hover:from-green-500 hover:to-green-700 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              desarrollado por panchito
            </a>
          </div>
        </footer>
      </div>
    </SidebarProvider>
  );
};

export default Index;
