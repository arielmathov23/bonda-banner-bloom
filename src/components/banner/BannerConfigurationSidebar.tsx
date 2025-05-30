
import React from 'react';
import { RefreshCw, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Partner } from './types';

interface BannerConfigurationSidebarProps {
  selectedPartner: Partner | undefined;
  bannerType: string;
  promotionDiscount: string;
  selectedStyle: string;
  bannerCopy: string;
  ctaCopy: string;
  onReset: () => void;
}

const BannerConfigurationSidebar: React.FC<BannerConfigurationSidebarProps> = ({
  selectedPartner,
  bannerType,
  promotionDiscount,
  selectedStyle,
  bannerCopy,
  ctaCopy,
  onReset,
}) => {
  return (
    <div className="space-y-4">
      {/* Banner Configuration - Made smaller */}
      <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0 rounded-2xl">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg flex items-center justify-center">
                <Sparkles className="w-3 h-3 text-white" />
              </div>
              <CardTitle className="text-sm font-semibold text-gray-700">Configuración</CardTitle>
            </div>
            <Button variant="outline" size="sm" onClick={onReset} className="rounded-lg border-gray-200 hover:bg-gray-50 text-xs">
              <RefreshCw className="w-3 h-3 mr-1" />
              Nuevo
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-3 space-y-3 text-xs">
            <div className="space-y-3">
              <div className="space-y-1">
                <span className="font-semibold text-gray-600">Socio</span>
                <p className="text-gray-800 font-medium">{selectedPartner?.name}</p>
              </div>
              <div className="space-y-1">
                <span className="font-semibold text-gray-600">Tipo</span>
                <p className="text-gray-800 font-medium">
                  {bannerType === 'promotion' ? 'Promocional' : 'General'}
                  {bannerType === 'promotion' && ` (${promotionDiscount}% desc)`}
                </p>
              </div>
              <div className="space-y-1">
                <span className="font-semibold text-gray-600">Estilo</span>
                <p className="text-gray-800 font-medium">{selectedStyle}</p>
              </div>
            </div>
            <div className="border-t border-gray-200 pt-3">
              <span className="font-semibold text-gray-600">Texto del Banner</span>
              <p className="text-gray-800 font-medium mt-1">"{bannerCopy}"</p>
            </div>
            <div className="border-t border-gray-200 pt-3">
              <span className="font-semibold text-gray-600">CTA</span>
              <p className="text-gray-800 font-medium mt-1">"{ctaCopy}"</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BannerConfigurationSidebar;
