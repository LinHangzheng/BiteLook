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
  setProgress: (progress: ProcessingProgress | null) => void;
  setIsProcessing: (isProcessing: boolean) => void;
  reset: () => void;
  logout: () => void;
}

export const useMenuStore = create<MenuState>((set) => ({
  inviteCode: null,
  isValidated: false,
  uploadedImages: [],
  maxImages: 5,
  isProcessing: false,
  progress: null,
  parsedMenu: null,
  menuItems: [],
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
      uploadedImages: [],
      isProcessing: false,
      progress: null,
      parsedMenu: null,
      menuItems: [],
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
    });
  },
}));
