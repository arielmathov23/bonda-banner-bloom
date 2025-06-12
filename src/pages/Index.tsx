import React, { useState, useEffect } from 'react';
import { Users, Image, Plus, History, ChevronRight, Wand2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { usePartners, type Partner } from '@/hooks/usePartners';
import PartnerList from '@/components/PartnerList';
import PartnerCreationForm from '@/components/PartnerCreationForm';
import BannerHistory from '@/components/BannerHistory';
import BannerGeneration from '@/components/BannerGeneration';

const Index = () => {
  const [activeSection, setActiveSection] = useState('home');
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>('');
  const { partners } = usePartners();

  // Get saved banners from localStorage
  const getSavedBanners = () => {
    try {
      const saved = localStorage.getItem('savedBanners');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  };

  const [savedBanners, setSavedBanners] = useState(() => getSavedBanners());
  const recentBanners = savedBanners.slice(0, 3); // Show only the 3 most recent

  // Listen for localStorage changes and update savedBanners
  useEffect(() => {
    const handleStorageChange = () => {
      setSavedBanners(getSavedBanners());
    };

    // Listen for custom storage event
    window.addEventListener('bannerSaved', handleStorageChange);
    // Also listen for storage events (for cross-tab updates)
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('bannerSaved', handleStorageChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Refresh banners when returning to home section
  useEffect(() => {
    if (activeSection === 'home') {
      setSavedBanners(getSavedBanners());
    }
  }, [activeSection]);

  // Calculate banner count per partner
  const getPartnerBannerCount = (partnerId: string) => {
    return savedBanners.filter((banner: any) => banner.partnerId === partnerId).length;
  };

  const stats = [
    { title: 'Socios Totales', value: partners.length.toString(), icon: Users },
    { title: 'Banners Generados', value: savedBanners.length.toString(), icon: Image },
  ];

  const handleEditPartner = (partner: Partner) => {
    setEditingPartner(partner);
    handleSectionChange('edit-partner');
  };

  const handlePartnerFormSuccess = () => {
    setEditingPartner(null);
    handleSectionChange('partners');
  };

  const handlePartnerClick = (partnerId: string) => {
    setSelectedPartnerId(partnerId);
    setActiveSection('partner-banners');
  };

  const handleCreateBannerForPartner = (partnerId: string) => {
    setSelectedPartnerId(partnerId);
    setActiveSection('create-banner');
  };

  const handleSectionChange = (section: string) => {
    // Clear selected partner when switching to certain sections
    if (section === 'home' || section === 'partners' || section === 'banner-list') {
      setSelectedPartnerId('');
    }
    setActiveSection(section);
  };

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
                        <p className="text-3xl font-semibold text-gray-700">{stat.value}</p>
                      </div>
                      <div className="w-12 h-12 rounded-lg bg-brand-50 flex items-center justify-center">
                        <stat.icon className="w-6 h-6 text-brand-500" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Partners Grid */}
            <Card className="bg-white border border-brand-100 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-semibold text-gray-700">Socios</CardTitle>
                  <CardDescription className="text-gray-600">Accede a los banners de cada socio</CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => handleSectionChange('partners')}
                  className="border-brand-200 text-brand-600 hover:bg-brand-50"
                >
                  Gestionar Socios
                </Button>
              </CardHeader>
              <CardContent>
                {partners.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-brand-50 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <Users className="w-8 h-8 text-brand-300" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No hay socios aún</h3>
                    <p className="text-gray-500 mb-4">Agrega tu primer socio para comenzar</p>
                    <Button 
                      onClick={() => handleSectionChange('create-partner')}
                      className="bg-brand-500 hover:bg-brand-600 text-white"
                    >
                      Agregar Socio
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {partners.map((partner) => (
                      <div 
                        key={partner.id} 
                        className="group cursor-pointer bg-white p-4 rounded-lg border border-brand-100 hover:border-brand-300 hover:shadow-md transition-all duration-300"
                        onClick={() => handlePartnerClick(partner.id)}
                      >
                        <div className="flex flex-col items-center text-center space-y-3">
                          <div className="w-12 h-12 rounded-lg bg-brand-50 border border-brand-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                            {partner.logo_url ? (
                              <img 
                                src={partner.logo_url} 
                                alt={`${partner.name} logo`}
                                className="w-full h-full object-cover rounded-lg"
                              />
                            ) : (
                              <Users className="w-6 h-6 text-brand-400" />
                            )}
                          </div>
                          
                          <div className="space-y-1">
                            <h4 className="font-semibold text-gray-900 text-sm leading-tight">{partner.name}</h4>
                            <p className="text-xs text-gray-500">
                              {getPartnerBannerCount(partner.id)} banners generados
                            </p>
                          </div>
                          
                          <div className="text-xs text-brand-600 font-medium group-hover:text-brand-700 transition-colors">
                            Ver banners →
                          </div>
                      </div>
                      </div>
                    ))}
                    </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Banners or Empty State */}
            {savedBanners.length === 0 ? (
              /* Empty State - No banners created yet */
              <Card className="bg-white border border-gray-200 shadow-sm">
                <CardContent className="p-12 text-center">
                  <div className="w-16 h-16 bg-violet-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Wand2 className="w-8 h-8 text-violet-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Crea tu primer banner</h3>
                  <p className="text-gray-500 mb-6">Genera banners profesionales con IA</p>
                  <Button 
                    onClick={() => handleSectionChange('create-banner')}
                    className="bg-violet-600 hover:bg-violet-700 text-white px-6 py-2"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Crear Banner
                  </Button>
                </CardContent>
              </Card>
            ) : (
              /* Recent Banners Section */
              <Card className="bg-white border border-gray-200 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-semibold text-gray-900">Banners Recientes</CardTitle>
                    <CardDescription className="text-gray-500">Tus últimos banners generados</CardDescription>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleSectionChange('banner-list')}
                    className="text-violet-600 border-violet-200 hover:bg-violet-50"
                  >
                    Ver todos
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {recentBanners.map((banner: any, index: number) => (
                      <div key={banner.id || index} className="group relative">
                        <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                          <img 
                            src={banner.selectedOption?.desktopUrl || banner.imageUrl} 
                            alt={banner.selectedOption?.copy || banner.customCopy || `Banner ${index + 1}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          />
                        </div>
                        <div className="mt-2">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {banner.selectedOption?.copy || banner.customCopy || `Banner ${index + 1}`}
                          </p>
                          <p className="text-xs text-gray-500">{banner.partnerName || 'Sin socio'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 text-center">
                    <Button 
                      onClick={() => handleSectionChange('create-banner')}
                      className="bg-violet-600 hover:bg-violet-700 text-white px-6 py-2"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Crear Nuevo Banner
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        );

      case 'partners':
        return (
          <div className="space-y-8">
            {/* Partners List */}
            <Card className="bg-white border border-brand-100 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-semibold text-gray-700">Directorio de Socios</CardTitle>
                  <CardDescription className="text-gray-600">Gestiona tus asociaciones comerciales</CardDescription>
                </div>
                <Button 
                  onClick={() => {
                    setEditingPartner(null);
                    handleSectionChange('create-partner');
                  }}
                  className="bg-brand-500 hover:bg-brand-600 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Crear Socio
                </Button>
              </CardHeader>
              <CardContent>
                <PartnerList onEditPartner={handleEditPartner} />
              </CardContent>
            </Card>
          </div>
        );

      case 'create-partner':
        return (
              <PartnerCreationForm onSuccess={handlePartnerFormSuccess} />
        );

      case 'edit-partner':
        return (
          <Card className="bg-white border border-brand-100 shadow-sm">
            <CardContent className="p-6">
              <PartnerCreationForm 
                editingPartner={editingPartner} 
                onSuccess={handlePartnerFormSuccess} 
              />
            </CardContent>
          </Card>
        );

      case 'banner-list':
        return <BannerHistory />;

      case 'partner-banners':
        const selectedPartner = partners.find(p => p.id === selectedPartnerId);
        return <BannerHistory partnerId={selectedPartnerId} partnerName={selectedPartner?.name} onCreateBanner={() => handleCreateBannerForPartner(selectedPartnerId)} />;

      case 'create-banner':
        if (selectedPartnerId) {
          return <BannerGeneration preSelectedPartnerId={selectedPartnerId} />;
        } else {
          return (
            <Card className="bg-white border border-brand-100 shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-gray-700">Seleccionar Socio</CardTitle>
                <CardDescription className="text-gray-600">Elige el socio para el cual quieres crear un banner</CardDescription>
              </CardHeader>
              <CardContent>
                {partners.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-brand-50 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <Users className="w-8 h-8 text-brand-300" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No hay socios</h3>
                    <p className="text-gray-500 mb-4">Necesitas agregar un socio antes de crear banners</p>
                    <Button 
                      onClick={() => handleSectionChange('create-partner')}
                      className="bg-brand-500 hover:bg-brand-600 text-white"
                    >
                      Agregar Socio
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {partners.map((partner) => (
                      <div 
                        key={partner.id} 
                        className="group cursor-pointer p-6 rounded-lg border border-brand-100 hover:border-brand-300 transition-all hover:shadow-md"
                        onClick={() => handleCreateBannerForPartner(partner.id)}
                      >
                        <div className="flex items-center space-x-4 mb-4">
                          <div className="w-16 h-16 rounded-lg bg-brand-50 flex items-center justify-center flex-shrink-0 overflow-hidden">
                            {partner.logo_url ? (
                              <img 
                                src={partner.logo_url} 
                                alt={`${partner.name} logo`}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Users className="w-8 h-8 text-brand-300" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-gray-900 text-lg">{partner.name}</h4>
                            <p className="text-sm text-gray-500 mt-1">
                              {getPartnerBannerCount(partner.id)} banners existentes
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-brand-600 font-medium">Crear banner</span>
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <ChevronRight className="w-5 h-5 text-brand-600" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        }

      default:
        return null;
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-brand-25 flex w-full">
        <AppSidebar activeSection={activeSection} setActiveSection={handleSectionChange} />
          
        <div className="flex-1 flex flex-col min-h-screen">
            {/* Main Content */}
          <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
              {renderContent()}
            </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Index;
