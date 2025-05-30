
import React from 'react';
import { Wand2, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BannerOption } from './types';

interface BannerPreviewProps {
  hasGenerated: boolean;
  generatedOptions: BannerOption[];
  currentOptionIndex: number;
  onPreviousOption: () => void;
  onNextOption: () => void;
  onDownloadBanner: (size: 'desktop' | 'mobile') => void;
  onSaveBanner: () => void;
}

const BannerPreview: React.FC<BannerPreviewProps> = ({
  hasGenerated,
  generatedOptions,
  currentOptionIndex,
  onPreviousOption,
  onNextOption,
  onDownloadBanner,
  onSaveBanner,
}) => {
  const currentOption = generatedOptions[currentOptionIndex];

  if (!hasGenerated) {
    return (
      <div className="flex-1 flex flex-col gap-6 min-w-0">
        {/* Banner Placeholder Preview */}
        <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0 rounded-2xl flex-1">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-gray-400 to-gray-500 rounded-lg flex items-center justify-center">
                <Wand2 className="w-4 h-4 text-white" />
              </div>
              <CardTitle className="text-lg font-semibold text-gray-700">Vista Previa del Banner</CardTitle>
            </div>
            <CardDescription className="text-gray-500">
              Completa el formulario y genera tu banner para ver el resultado aquí
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 p-6 pt-0 flex-1">
            <Tabs defaultValue="desktop" className="w-full h-full flex flex-col">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="desktop" className="text-gray-600">Escritorio</TabsTrigger>
                <TabsTrigger value="mobile" className="text-gray-600">Móvil</TabsTrigger>
              </TabsList>
              
              <div className="flex-1 flex flex-col">
                <TabsContent value="desktop" className="flex-1 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-gray-600">Versión Escritorio</h4>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">1440×338px</span>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 flex-1 flex items-center justify-center">
                    <img
                      src="/lovable-uploads/24230cd3-ea20-4f08-945b-1150e752d65f.png"
                      alt="Placeholder Banner Escritorio"
                      className="w-full rounded-lg border border-gray-200 shadow-sm max-h-full object-contain"
                    />
                  </div>
                </TabsContent>
                
                <TabsContent value="mobile" className="flex-1 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-gray-600">Versión Móvil</h4>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">984×450px</span>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 flex-1 flex items-center justify-center">
                    <img
                      src="/lovable-uploads/24230cd3-ea20-4f08-945b-1150e752d65f.png"
                      alt="Placeholder Banner Móvil"
                      className="w-full max-w-sm rounded-lg border border-gray-200 shadow-sm max-h-full object-contain"
                    />
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col gap-6 min-w-0">
      {/* Banner Preview with Tabs */}
      <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0 rounded-2xl flex-1">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <Wand2 className="w-4 h-4 text-white" />
              </div>
              <CardTitle className="text-lg font-semibold text-gray-700">Banner Generado</CardTitle>
            </div>
            {generatedOptions.length > 1 && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onPreviousOption}
                  disabled={currentOptionIndex === 0}
                  className="rounded-lg"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm font-medium px-3 text-gray-600">
                  {currentOptionIndex + 1} de {generatedOptions.length}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onNextOption}
                  disabled={currentOptionIndex === generatedOptions.length - 1}
                  className="rounded-lg"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6 p-6 pt-0 flex-1">
          <Tabs defaultValue="desktop" className="w-full h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="desktop" className="text-gray-600">Escritorio</TabsTrigger>
              <TabsTrigger value="mobile" className="text-gray-600">Móvil</TabsTrigger>
            </TabsList>
            
            <div className="flex-1 flex flex-col">
              <TabsContent value="desktop" className="flex-1 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-gray-600">Versión Escritorio</h4>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">1440×338px</span>
                </div>
                <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 flex-1 flex items-center justify-center">
                  <img
                    src={currentOption?.desktopUrl}
                    alt="Banner Escritorio"
                    className="w-full rounded-lg border border-gray-200 shadow-sm max-h-full object-contain"
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="mobile" className="flex-1 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-gray-600">Versión Móvil</h4>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">984×450px</span>
                </div>
                <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 flex-1 flex items-center justify-center">
                  <img
                    src={currentOption?.mobileUrl}
                    alt="Banner Móvil"
                    className="w-full max-w-sm rounded-lg border border-gray-200 shadow-sm max-h-full object-contain"
                  />
                </div>
              </TabsContent>
            </div>
          </Tabs>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <Button
              onClick={() => onDownloadBanner('desktop')}
              className="bg-blue-600 hover:bg-blue-700 rounded-xl flex-1"
              size="lg"
            >
              <Download className="w-4 h-4 mr-2" />
              Descargar Escritorio
            </Button>
            <Button
              onClick={() => onDownloadBanner('mobile')}
              className="bg-green-600 hover:bg-green-700 rounded-xl flex-1"
              size="lg"
            >
              <Download className="w-4 h-4 mr-2" />
              Descargar Móvil
            </Button>
            <Button
              onClick={onSaveBanner}
              className="bg-purple-600 hover:bg-purple-700 rounded-xl"
              size="lg"
            >
              Guardar Proyecto
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BannerPreview;
