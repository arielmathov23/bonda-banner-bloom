export interface BannerComposition {
  id: string;
  bannerId: string;
  backgroundImageUrl: string;
  assets: BannerAsset[];
  canvasSize: { width: number; height: number };
  zoom: number;
  lastModified: Date;
}

export interface BannerAsset {
  id: string;
  type: 'logo' | 'text' | 'cta' | 'product';
  position: { x: number; y: number };
  size: { width: number; height: number };
  rotation: number;
  // For logo and product assets
  imageUrl?: string;
  // For text assets
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  fontWeight?: 'normal' | 'bold';
  textAlign?: 'left' | 'center' | 'right';
  // For CTA button assets
  backgroundColor?: string;
  borderRadius?: number;
  borderColor?: string;
  borderWidth?: number;
}

export interface EditorState {
  selectedAssetId: string | null;
  isDragging: boolean;
  isResizing: boolean;
  dragOffset: { x: number; y: number };
  zoom: number;
  canvasPosition: { x: number; y: number };
}

export interface ExportOptions {
  format: 'png' | 'jpg';
  quality: number;
  scale: number;
} 