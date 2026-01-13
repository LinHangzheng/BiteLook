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
}

export interface ParsedMenu {
  originalLanguage: string;
  items: Omit<MenuItem, 'id' | 'generatedImageBase64'>[];
}

export type DisplayMode = 'simple' | 'fancy';

export interface ProcessingProgress {
  stage: 'uploading' | 'parsing' | 'generating' | 'complete' | 'error';
  currentItem?: number;
  totalItems?: number;
  message: string;
}
