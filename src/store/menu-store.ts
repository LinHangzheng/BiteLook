import { create } from 'zustand';
import type { MenuItem, ParsedMenu, DisplayMode, ProcessingProgress } from '@/types/menu';

interface MenuState {
  // Upload state
  uploadedImage: string | null;
  uploadedImageMimeType: string | null;

  // Processing state
  isProcessing: boolean;
  progress: ProcessingProgress | null;

  // Result state
  parsedMenu: ParsedMenu | null;
  menuItems: MenuItem[];

  // Display preferences
  displayMode: DisplayMode;

  // Actions
  setUploadedImage: (image: string, mimeType: string) => void;
  clearUploadedImage: () => void;
  setDisplayMode: (mode: DisplayMode) => void;
  setParsedMenu: (menu: ParsedMenu) => void;
  updateItemImage: (index: number, imageBase64: string) => void;
  setProgress: (progress: ProcessingProgress | null) => void;
  setIsProcessing: (isProcessing: boolean) => void;
  reset: () => void;
}

export const useMenuStore = create<MenuState>((set) => ({
  uploadedImage: null,
  uploadedImageMimeType: null,
  isProcessing: false,
  progress: null,
  parsedMenu: null,
  menuItems: [],
  displayMode: 'simple',

  setUploadedImage: (image, mimeType) =>
    set({
      uploadedImage: image,
      uploadedImageMimeType: mimeType,
    }),

  clearUploadedImage: () =>
    set({
      uploadedImage: null,
      uploadedImageMimeType: null,
    }),

  setDisplayMode: (mode) => set({ displayMode: mode }),

  setParsedMenu: (menu) =>
    set({
      parsedMenu: menu,
      menuItems: menu.items.map((item, i) => ({
        ...item,
        id: `dish-${i}`,
      })),
    }),

  updateItemImage: (index, imageBase64) =>
    set((state) => ({
      menuItems: state.menuItems.map((item, i) =>
        i === index ? { ...item, generatedImageBase64: imageBase64 } : item
      ),
    })),

  setProgress: (progress) => set({ progress }),

  setIsProcessing: (isProcessing) => set({ isProcessing }),

  reset: () =>
    set({
      uploadedImage: null,
      uploadedImageMimeType: null,
      isProcessing: false,
      progress: null,
      parsedMenu: null,
      menuItems: [],
    }),
}));
