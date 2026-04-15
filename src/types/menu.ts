export type ImageGenerationStatus = 'idle' | 'loading' | 'success' | 'error';

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price?: string;
  category?: string;
  ingredients?: string[];
  originalLanguage?: string;
  translatedName?: string;
  translatedDescription?: string;
  generatedImageBase64?: string;
  imageGenerationStatus?: ImageGenerationStatus;
}

export interface ParsedMenu {
  originalLanguage: string;
  items: Omit<MenuItem, 'id' | 'generatedImageBase64'>[];
}

export type DisplayMode = 'simple' | 'fancy';

export interface MenuImage {
  id: string;
  base64: string;
  mimeType: string;
  order: number;
}

export interface MultiImageUpload {
  images: MenuImage[];
  totalImages: number;
}

export interface ProcessingProgress {
  stage: 'uploading' | 'parsing' | 'combining' | 'generating' | 'complete' | 'error';
  currentImage?: number;
  totalImages?: number;
  currentItem?: number;
  totalItems?: number;
  message: string;
}
