import React, { useState, useEffect } from 'react';
import { Users, Image, Plus, History, ChevronRight, Wand2, Edit2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { usePartners, type Partner } from '@/hooks/usePartners';
import { useBanners } from '@/hooks/useBanners';
import PartnerList from '@/components/PartnerList';
import PartnerCreationForm from '@/components/PartnerCreationForm';
import BannerHistory from '@/components/BannerHistory';
import BannerGeneration from '@/components/BannerGeneration';
import BannerEditor from '@/components/BannerEditor';
import '@/lib/storage-test'; // Import storage test to run automatically

const Index = () => {
  const [activeSection, setActiveSection] = useState('home');
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>('');
  const [editingBanner, setEditingBanner] = useState<any>(null);
  const { partners, fetchPartners } = usePartners();
  const { banners, isLoading, fetchBanners, getRecentBanners, getTotalBanners, getPartnerBannerCount } = useBanners();

  const recentBanners = getRecentBanners(3); // Show only the 3 most recent

  // Refresh banners when returning to home section
  useEffect(() => {
    if (activeSection === 'home') {
      fetchBanners();
    }
  }, [activeSection]);

  // Auto-refresh partners when switching to create-banner section
  useEffect(() => {
    if (activeSection === 'create-banner') {
      fetchPartners();
    }
  }, [activeSection]);

  // Debug: Track activeSection changes
  useEffect(() => {
    console.log('activeSection changed to:', activeSection);
  }, [activeSection]);

  // Handle reset banner editor event from sidebar
  useEffect(() => {
    const handleResetBannerEditor = () => {
      console.log('Resetting banner editor state...');
      setEditingBanner(null);
      setSelectedPartnerId('');
    };

    window.addEventListener('resetBannerEditor', handleResetBannerEditor);
    return () => window.removeEventListener('resetBannerEditor', handleResetBannerEditor);
  }, []);

  const stats = [
    { title: 'Socios Totales', value: partners.length.toString(), icon: Users },
    { title: 'Banners Generados', value: getTotalBanners().toString(), icon: Image },
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

  // New function to handle partner selection in create-banner section
  const handlePartnerSelection = (partnerId: string) => {
    setSelectedPartnerId(partnerId);
  };

  const handleEditBanner = (banner: any) => {
    setEditingBanner(banner);
    setActiveSection('edit-banner');
  };

  const handleSectionChange = (section: string) => {
    console.log('handleSectionChange called with:', section, 'from current:', activeSection);
    
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
            {getTotalBanners() === 0 ? (
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
              // Recent Banners Section
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
                      <div 
                        key={banner.id || index} 
                        className="group relative cursor-pointer transition-all duration-200 hover:scale-105"
                        onClick={() => {
                          console.log('Editing banner from recent banners:', banner);
                          handleEditBanner({
                            id: banner.id,
                            partnerId: banner.partner_id,
                            partner_id: banner.partner_id,
                            partner: partners.find(p => p.id === banner.partner_id)?.name || 'Sin socio',
                            partner_name: partners.find(p => p.id === banner.partner_id)?.name || 'Sin socio',
                            main_text: banner.main_text,
                            banner_title: banner.banner_title,
                            title: banner.banner_title,
                            description_text: banner.description_text,
                            cta_text: banner.cta_text
                          });
                        }}
                      >
                        <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden relative">
                          {banner.image_url ? (
                            <img 
                              src={banner.image_url} 
                              alt={banner.banner_title || `Banner ${index + 1}`}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                              onError={(e) => {
                                console.error('Failed to load banner image:', banner.image_url);
                                // Show placeholder on error
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                target.nextElementSibling?.classList.remove('hidden');
                              }}
                            />
                          ) : null}
                          <div className="w-full h-full flex items-center justify-center bg-gray-100 hidden">
                            <Image className="w-12 h-12 text-gray-400" />
                          </div>
                          
                          {/* Subtle edit overlay */}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200 flex items-center justify-center">
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white/90 rounded-full p-2">
                              <Edit2 className="w-4 h-4 text-gray-700" />
                            </div>
                          </div>
                        </div>
                        <div className="mt-2">
                          <p className="text-sm font-medium text-gray-900 truncate group-hover:text-violet-600 transition-colors duration-200">
                            {banner.banner_title || `Banner ${index + 1}`}
                          </p>
                          <p className="text-xs text-gray-500">
                            {partners.find(p => p.id === banner.partner_id)?.name || 'Sin socio'}
                          </p>
                          <p className="text-xs text-gray-400">
                            {new Date(banner.created_at).toLocaleDateString()}
                          </p>
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
        return <BannerHistory onEditBanner={handleEditBanner} />;

      case 'partner-banners':
        const selectedPartner = partners.find(p => p.id === selectedPartnerId);
        return <BannerHistory partnerId={selectedPartnerId} partnerName={selectedPartner?.name} onCreateBanner={() => handleCreateBannerForPartner(selectedPartnerId)} onEditBanner={handleEditBanner} />;

      case 'edit-banner':
        if (editingBanner) {
          const partner = partners.find(p => p.id === editingBanner.partnerId);
          
          return (
            <BannerEditor
              backgroundImageUrl="" // Let BannerEditor load from database to get both background AND product images
              partnerId={editingBanner.partnerId || editingBanner.partner_id || ""}
              partnerName={editingBanner.partner || editingBanner.partner_name || ""}
              partnerLogoUrl={partner?.logo_url}
              bannerText={editingBanner.main_text || editingBanner.banner_title || editingBanner.title || ""}
              descriptionText={editingBanner.description_text || ""}
              ctaText={editingBanner.cta_text || "Ver más"}
              bannerId={editingBanner.id}
              onExit={() => setActiveSection('banner-list')}
              onSave={(composition) => {
                console.log('Banner composition saved:', composition);
                // Don't auto-close - let user decide when to exit
              }}
            />
          );
        }
        return null;

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
      <div className="min-h-screen bg-brand-25 w-full">
        <AppSidebar activeSection={activeSection} setActiveSection={handleSectionChange} />
          
        {/* Main Content - offset by sidebar width */}
        <div className="ml-64 min-h-screen">
          <main className="p-6 lg:p-8 min-h-screen overflow-y-auto">
            {renderContent()}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Index;
