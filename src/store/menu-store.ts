import { create } from 'zustand';
import type { MenuItem, ParsedMenu, DisplayMode, ProcessingProgress, MenuImage } from '@/types/menu';

interface MenuState {
  // Auth state
  inviteCode: string | null;
  isValidated: boolean;

  // Upload state
  uploadedImages: MenuImage[];
  maxImages: number;

  // Processing state
  isProcessing: boolean;
  progress: ProcessingProgress | null;

  // Result state
  parsedMenu: ParsedMenu | null;
  menuItems: MenuItem[];

  // Image generation tracking
  imageGenerationCount: number;
  imageGenerationLimit: number;

  // Display preferences
  displayMode: DisplayMode;

  // Actions
  setInviteCode: (code: string) => void;
  setIsValidated: (validated: boolean) => void;
  addUploadedImage: (image: string, mimeType: string) => void;
  removeUploadedImage: (id: string) => void;
  clearUploadedImages: () => void;
  setDisplayMode: (mode: DisplayMode) => void;
  setParsedMenu: (menu: ParsedMenu) => void;
  updateItemImage: (index: number, imageBase64: string) => void;
  generateImageForItem: (index: number) => Promise<void>;
  setProgress: (progress: ProcessingProgress | null) => void;
  setIsProcessing: (isProcessing: boolean) => void;
  reset: () => void;
  logout: () => void;
}

export const useMenuStore = create<MenuState>((set, get) => ({
  inviteCode: null,
  isValidated: false,
  uploadedImages: [],
  maxImages: 5,
  isProcessing: false,
  progress: null,
  parsedMenu: null,
  menuItems: [],
  imageGenerationCount: 0,
  imageGenerationLimit: 10,
  displayMode: 'simple',

  setInviteCode: (code) => set({ inviteCode: code }),

  setIsValidated: (validated) => set({ isValidated: validated }),

  addUploadedImage: (image, mimeType) =>
    set((state) => {
      const newImage: MenuImage = {
        id: `image-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        base64: image,
        mimeType,
        order: state.uploadedImages.length,
      };
      return {
        uploadedImages: [...state.uploadedImages, newImage],
      };
    }),

  removeUploadedImage: (id) =>
    set((state) => ({
      uploadedImages: state.uploadedImages
        .filter((img) => img.id !== id)
        .map((img, index) => ({ ...img, order: index })),
    })),

  clearUploadedImages: () =>
    set({
      uploadedImages: [],
    }),

  setDisplayMode: (mode) => set({ displayMode: mode }),

  setParsedMenu: (menu) =>
    set({
      parsedMenu: menu,
      menuItems: menu.items.map((item, i) => ({
        ...item,
        id: `dish-${i}`,
        imageGenerationStatus: 'idle' as const,
      })),
    }),

  updateItemImage: (index, imageBase64) =>
    set((state) => ({
      menuItems: state.menuItems.map((item, i) =>
        i === index
          ? { ...item, generatedImageBase64: imageBase64, imageGenerationStatus: 'success' as const }
          : item
      ),
      imageGenerationCount: state.imageGenerationCount + 1,
    })),

  generateImageForItem: async (index: number) => {
    const state = get();

    if (state.imageGenerationCount >= state.imageGenerationLimit) {
      return;
    }

    const item = state.menuItems[index];
    if (!item || item.generatedImageBase64 || item.imageGenerationStatus === 'loading') {
      return;
    }

    // Set loading state
    set((s) => ({
      menuItems: s.menuItems.map((it, i) =>
        i === index ? { ...it, imageGenerationStatus: 'loading' as const } : it
      ),
    }));

    try {
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dishName: item.translatedName || item.name,
          description: item.translatedDescription || item.description,
          ingredients: item.ingredients,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate image');
      }

      const data = await response.json();

      if (data.imageBase64) {
        set((s) => ({
          menuItems: s.menuItems.map((it, i) =>
            i === index
              ? { ...it, generatedImageBase64: data.imageBase64, imageGenerationStatus: 'success' as const }
              : it
          ),
          imageGenerationCount: s.imageGenerationCount + 1,
        }));
      } else {
        set((s) => ({
          menuItems: s.menuItems.map((it, i) =>
            i === index ? { ...it, imageGenerationStatus: 'error' as const } : it
          ),
        }));
      }
    } catch {
      set((s) => ({
        menuItems: s.menuItems.map((it, i) =>
          i === index ? { ...it, imageGenerationStatus: 'error' as const } : it
        ),
      }));
    }
  },

  setProgress: (progress) => set({ progress }),

  setIsProcessing: (isProcessing) => set({ isProcessing }),

  reset: () =>
    set({
      uploadedImages: [],
      isProcessing: false,
      progress: null,
      parsedMenu: null,
      menuItems: [],
      imageGenerationCount: 0,
    }),

  logout: () => {
    // Clear cookie (uses dynamic import to avoid SSR issues)
    if (typeof window !== 'undefined') {
      import('js-cookie').then((Cookies) => {
        Cookies.default.remove('bitelook_invite_code');
      });
    }
    set({
      inviteCode: null,
      isValidated: false,
      uploadedImages: [],
      isProcessing: false,
      progress: null,
      parsedMenu: null,
      menuItems: [],
      imageGenerationCount: 0,
    });
  },
}));
