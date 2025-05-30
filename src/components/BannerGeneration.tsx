
import React, { useState } from 'react';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePartners } from '@/hooks/usePartners';
import { useBannerGeneration } from '@/hooks/useBannerGeneration';
import BannerFormInputs from '@/components/BannerFormInputs';
import BannerPreview from '@/components/banner/BannerPreview';
import BannerConfigurationSidebar from '@/components/banner/BannerConfigurationSidebar';

const BannerGeneration = () => {
  // Form state
  const [selectedPartnerId, setSelectedPartnerId] = useState('');
  const [bannerType, setBannerType] = useState('');
  const [promotionDiscount, setPromotionDiscount] = useState('');
  const [bannerCopy, setBannerCopy] = useState('');
  const [ctaCopy, setCtaCopy] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('');
  const [selectedFlavor, setSelectedFlavor] = useState('');

  // Layout state
  const [sidebarExpanded, setSidebarExpanded] = useState(true);

  const { partners, isLoading: partnersLoading } = usePartners();
  const selectedPartner = partners.find(p => p.id === selectedPartnerId);

  const {
    isGenerating,
    progress,
    generatedOptions,
    currentOptionIndex,
    hasGenerated,
    generateBannerOptions,
    downloadBanner,
    saveBanner,
    nextOption,
    previousOption,
    resetForm,
  } = useBannerGeneration();

  const handleGenerate = () => {
    generateBannerOptions(
      selectedPartnerId,
      bannerType,
      promotionDiscount,
      bannerCopy,
      ctaCopy,
      selectedStyle,
      selectedFlavor,
      selectedPartner
    );
  };

  const handleSaveBanner = () => {
    saveBanner(bannerCopy, selectedPartner);
  };

  const handleResetForm = () => {
    setSelectedPartnerId('');
    setBannerType('');
    setPromotionDiscount('');
    setBannerCopy('');
    setCtaCopy('');
    setSelectedStyle('');
    setSelectedFlavor('');
    resetForm();
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-8 p-8 bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Menu Toggle Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setSidebarExpanded(!sidebarExpanded)}
        className="fixed top-20 left-4 z-50 bg-white shadow-lg border-gray-200 hover:bg-gray-50"
      >
        <Menu className="w-4 h-4" />
      </Button>

      {/* Left Column - Configuration (when generated) or Full Form (when not generated) */}
      <div className={`transition-all duration-300 ${hasGenerated ? (sidebarExpanded ? 'w-80' : 'w-0 opacity-0') : 'w-full max-w-4xl mx-auto'} flex-shrink-0 ${hasGenerated && !sidebarExpanded ? 'hidden' : ''}`}>
        {hasGenerated ? (
          <BannerConfigurationSidebar
            selectedPartner={selectedPartner}
            bannerType={bannerType}
            promotionDiscount={promotionDiscount}
            selectedStyle={selectedStyle}
            bannerCopy={bannerCopy}
            ctaCopy={ctaCopy}
            onReset={handleResetForm}
          />
        ) : (
          <BannerFormInputs
            selectedPartnerId={selectedPartnerId}
            setSelectedPartnerId={setSelectedPartnerId}
            bannerType={bannerType}
            setBannerType={setBannerType}
            promotionDiscount={promotionDiscount}
            setPromotionDiscount={setPromotionDiscount}
            bannerCopy={bannerCopy}
            setBannerCopy={setBannerCopy}
            ctaCopy={ctaCopy}
            setCtaCopy={setCtaCopy}
            selectedStyle={selectedStyle}
            setSelectedStyle={setSelectedStyle}
            selectedFlavor={selectedFlavor}
            setSelectedFlavor={setSelectedFlavor}
            partners={partners}
            partnersLoading={partnersLoading}
            selectedPartner={selectedPartner}
            isGenerating={isGenerating}
            progress={progress}
            onGenerate={handleGenerate}
          />
        )}
      </div>

      {/* Right Column - Generated Banners (only when generated) OR Placeholder */}
      <BannerPreview
        hasGenerated={hasGenerated}
        generatedOptions={generatedOptions}
        currentOptionIndex={currentOptionIndex}
        onPreviousOption={previousOption}
        onNextOption={nextOption}
        onDownloadBanner={downloadBanner}
        onSaveBanner={handleSaveBanner}
      />
    </div>
  );
};

export default BannerGeneration;
