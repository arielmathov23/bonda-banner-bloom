
import React from 'react';
import { Wand2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Partner } from '@/hooks/usePartners';

interface BannerFormInputsProps {
  selectedPartnerId: string;
  setSelectedPartnerId: (value: string) => void;
  bannerType: string;
  setBannerType: (value: string) => void;
  promotionDiscount: string;
  setPromotionDiscount: (value: string) => void;
  bannerCopy: string;
  setBannerCopy: (value: string) => void;
  selectedStyle: string;
  setSelectedStyle: (value: string) => void;
  selectedFlavor: string;
  setSelectedFlavor: (value: string) => void;
  partners: Partner[];
  partnersLoading: boolean;
  selectedPartner: Partner | undefined;
  isGenerating: boolean;
  progress: number;
  onGenerate: () => void;
}

const BannerFormInputs = ({
  selectedPartnerId,
  setSelectedPartnerId,
  bannerType,
  setBannerType,
  promotionDiscount,
  setPromotionDiscount,
  bannerCopy,
  setBannerCopy,
  selectedStyle,
  setSelectedStyle,
  selectedFlavor,
  setSelectedFlavor,
  partners,
  partnersLoading,
  selectedPartner,
  isGenerating,
  progress,
  onGenerate
}: BannerFormInputsProps) => {
  const bannerStyles = [
    { id: 'bold-dynamic', name: 'Bold & Dynamic' },
    { id: 'minimal', name: 'Minimal' },
    { id: 'vibrant', name: 'Vibrant' }
  ];

  const bannerFlavors = [
    { id: 'contextual', name: 'Contextual' },
    { id: 'product-photo', name: 'Product Photo' }
  ];

  const formatRegions = (regions: string[]) => {
    const regionLabels: Record<string, string> = {
      'argentina-uruguay': 'Argentina & Uruguay',
      'latam': 'LATAM',
    };
    return regions.map(region => regionLabels[region] || region).join(', ');
  };

  const isFormValid = selectedPartnerId && bannerType && bannerCopy && selectedStyle && selectedFlavor && 
    (bannerType !== 'promotion' || promotionDiscount);

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Scrollable Content Area */}
      <div className="flex-1 min-h-0">
        <ScrollArea className="h-full">
          <div className="p-6">
            <div className="bg-gray-50 rounded-lg p-6 space-y-6">
              {/* Partner Selection */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-900">Partner</Label>
                {partnersLoading ? (
                  <div className="bg-white rounded-md p-3 border">
                    <p className="text-gray-600 text-sm">Loading partners...</p>
                  </div>
                ) : partners.length === 0 ? (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                    <p className="text-yellow-800 text-sm">No partners available. Create a partner first.</p>
                  </div>
                ) : (
                  <Select value={selectedPartnerId} onValueChange={setSelectedPartnerId}>
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Select a partner" />
                    </SelectTrigger>
                    <SelectContent className="bg-white shadow-lg border z-50">
                      {partners.map((partner) => (
                        <SelectItem key={partner.id} value={partner.id}>
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">{partner.name}</span>
                            <span className="text-xs text-gray-500">
                              ({formatRegions(partner.regions)})
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Banner Type */}
              <div className="space-y-3">
                <Label className="text-sm font-medium text-gray-900">Banner Type</Label>
                <div className="bg-white rounded-md p-4 border">
                  <RadioGroup value={bannerType} onValueChange={setBannerType} className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="general" id="general" />
                      <Label htmlFor="general" className="text-sm cursor-pointer">General</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="promotion" id="promotion" />
                      <Label htmlFor="promotion" className="text-sm cursor-pointer">Promotion</Label>
                    </div>
                  </RadioGroup>
                  
                  {bannerType === 'promotion' && (
                    <div className="mt-4 pt-4 border-t">
                      <Label className="text-xs text-gray-600 mb-2 block">Discount Percentage</Label>
                      <Input
                        type="number"
                        placeholder="e.g., 20"
                        value={promotionDiscount}
                        onChange={(e) => setPromotionDiscount(e.target.value)}
                        className="w-full"
                        min="1"
                        max="100"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Banner Copy */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-900">Banner Copy</Label>
                <div className="bg-white rounded-md p-4 border space-y-2">
                  <Textarea
                    value={bannerCopy}
                    onChange={(e) => setBannerCopy(e.target.value)}
                    placeholder="Enter your banner text..."
                    className="resize-none border-0 p-0 focus-visible:ring-0"
                    rows={3}
                    maxLength={100}
                  />
                  <div className="text-xs text-gray-500 text-right">
                    {bannerCopy.length}/100 characters
                  </div>
                </div>
              </div>

              {/* Style Selection */}
              <div className="space-y-3">
                <Label className="text-sm font-medium text-gray-900">Style</Label>
                <div className="bg-white rounded-md p-4 border">
                  <RadioGroup value={selectedStyle} onValueChange={setSelectedStyle} className="space-y-3">
                    {bannerStyles.map((style) => (
                      <div key={style.id} className="flex items-center space-x-2">
                        <RadioGroupItem value={style.id} id={style.id} />
                        <Label htmlFor={style.id} className="text-sm cursor-pointer">{style.name}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              </div>

              {/* Flavor Selection */}
              <div className="space-y-3">
                <Label className="text-sm font-medium text-gray-900">Image Type</Label>
                <div className="bg-white rounded-md p-4 border">
                  <RadioGroup value={selectedFlavor} onValueChange={setSelectedFlavor} className="space-y-3">
                    {bannerFlavors.map((flavor) => (
                      <div key={flavor.id} className="flex items-center space-x-2">
                        <RadioGroupItem value={flavor.id} id={flavor.id} />
                        <Label htmlFor={flavor.id} className="text-sm cursor-pointer">{flavor.name}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              </div>

              {/* Selected Partner Info */}
              {selectedPartner && (
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                  <div className="font-medium text-blue-900 text-sm mb-1">{selectedPartner.name}</div>
                  <div className="text-blue-700 text-xs">
                    {formatRegions(selectedPartner.regions)} • {selectedPartner.status}
                  </div>
                  {selectedPartner.description && (
                    <div className="text-blue-600 text-xs mt-1">{selectedPartner.description}</div>
                  )}
                </div>
              )}

              {/* Generation Progress */}
              {isGenerating && (
                <div className="bg-purple-50 border border-purple-200 rounded-md p-4">
                  <div className="flex items-center mb-2">
                    <Sparkles className="w-4 h-4 text-purple-600 mr-2 animate-pulse" />
                    <span className="text-purple-700 font-medium text-sm">Generating banner...</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
      </div>

      {/* Fixed Generate Button at Bottom */}
      <div className="flex-shrink-0 p-6 border-t bg-white">
        <Button
          onClick={onGenerate}
          disabled={isGenerating || !isFormValid || partnersLoading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          size="lg"
        >
          {isGenerating ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Generating...
            </div>
          ) : (
            <>
              <Wand2 className="w-4 h-4 mr-2" />
              Generate Banner
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default BannerFormInputs;
