import React, { useState, useEffect } from 'react';
import { Search, MoreHorizontal, MapPin, Globe, Users, Edit, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { usePartners, Partner } from '@/hooks/usePartners';

interface PartnerListProps {
  onEditPartner?: (partner: Partner) => void;
}

const PartnerList = ({ onEditPartner }: PartnerListProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const { partners, isLoading, deletePartner, fetchPartners } = usePartners();

  // Refresh partners when component mounts or when we want to ensure fresh data
  useEffect(() => {
    console.log('PartnerList mounted, current partners:', partners);
  }, [partners]);

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

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatRegions = (regions: string[]) => {
    return regions.map(region => regionLabels[region] || region).join(', ');
  };

  const handleEditPartner = (partner: Partner) => {
    if (onEditPartner) {
      onEditPartner(partner);
    }
  };

  const handleDeletePartner = async (partnerId: string) => {
    await deletePartner(partnerId);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          placeholder="Buscar socios..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 bg-white border-brand-200 focus:border-brand-500 h-10"
        />
      </div>

      {/* Partners Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {partners.length === 0 ? (
          <div className="col-span-full">
            <Card className="bg-white border border-brand-100 shadow-sm">
              <CardContent className="p-12 text-center">
                <div className="w-16 h-16 bg-brand-50 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-brand-300" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No hay socios aún</h3>
                <p className="text-gray-500 mb-4">Crea tu primer socio para comenzar a generar banners</p>
                <p className="text-sm text-gray-400">Usa el botón "Crear Socio" para agregar uno nuevo</p>
              </CardContent>
            </Card>
          </div>
        ) : filteredPartners.length === 0 ? (
          <div className="col-span-full">
            <Card className="bg-white border border-brand-100 shadow-sm">
              <CardContent className="p-8 text-center">
                <p className="text-gray-500">No se encontraron socios que coincidan con tu búsqueda</p>
              </CardContent>
            </Card>
          </div>
        ) : (
          filteredPartners.map((partner) => (
            <Card
              key={partner.id}
              className="bg-white border border-brand-100 shadow-sm hover:shadow-md transition-all duration-200 hover:border-brand-300"
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-12 h-12 rounded-lg bg-brand-50 border border-brand-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {partner.logo_url ? (
                      <img 
                        src={partner.logo_url} 
                        alt={`${partner.name} logo`}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-brand-400 to-brand-600 rounded-lg flex items-center justify-center">
                        <span className="text-white font-semibold text-sm">
                          {getInitials(partner.name)}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-brand-50">
                        <MoreHorizontal className="w-4 h-4 text-gray-400" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEditPartner(partner)}>
                        <Edit className="w-4 h-4 mr-2" />
                        Editar Socio
                      </DropdownMenuItem>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                            <Trash2 className="w-4 h-4 mr-2" />
                            Eliminar Socio
                          </DropdownMenuItem>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esto eliminará permanentemente "{partner.name}" y todos los datos asociados. Esta acción no se puede deshacer.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleDeletePartner(partner.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Eliminar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                
                <div className="space-y-2">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-1 leading-tight">
                      {partner.name}
                    </h3>
                    <div className="flex items-center text-xs text-gray-500">
                      <MapPin className="w-3 h-3 mr-1 text-gray-400" />
                      {formatRegions(partner.regions)}
                    </div>
                  </div>
                  
                  {partner.partner_url && (
                    <div className="flex items-center text-xs text-gray-500">
                      <Globe className="w-3 h-3 mr-1 text-gray-400" />
                      <a 
                        href={partner.partner_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="hover:text-brand-600 truncate"
                      >
                        {partner.partner_url.replace(/^https?:\/\//, '').substring(0, 20)}...
                      </a>
                    </div>
                  )}
                  
                  <div className="pt-2 border-t border-brand-100">
                    <span className="text-xs text-gray-400">
                      {new Date(partner.created_at).toLocaleDateString()}
                    </span>
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

export default PartnerList;
