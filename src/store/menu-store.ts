import { create } from 'zustand';
import type { MenuItem, ParsedMenu, DisplayMode, ProcessingProgress, MenuImage, CartItem } from '@/types/menu';

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
  jobId: string | null;

  // Result state
  parsedMenu: ParsedMenu | null;
  menuItems: MenuItem[];

  // Image generation tracking
  imageGenerationCount: number;
  imageGenerationLimit: number;

  // Display preferences
  displayMode: DisplayMode;

  // Category filter state
  selectedCategory: string | null;

  // Cart state
  cart: CartItem[];

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
  setJobId: (id: string | null) => void;
  reset: () => void;
  logout: () => void;

  // Category filter actions
  setSelectedCategory: (category: string | null) => void;

  // Cart actions
  addToCart: (menuItemId: string) => void;
  removeFromCart: (menuItemId: string) => void;
  updateQuantity: (menuItemId: string, quantity: number) => void;
  clearCart: () => void;
}

export const useMenuStore = create<MenuState>((set, get) => ({
  inviteCode: null,
  isValidated: false,
  uploadedImages: [],
  maxImages: 5,
  isProcessing: false,
  progress: null,
  jobId: null,
  parsedMenu: null,
  menuItems: [],
  imageGenerationCount: 0,
  imageGenerationLimit: 10,
  displayMode: 'simple',
  selectedCategory: null,
  cart: [],

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

  setJobId: (id) => {
    if (typeof window !== 'undefined') {
      if (id) {
        localStorage.setItem('bitelook_current_job_id', id);
      } else {
        localStorage.removeItem('bitelook_current_job_id');
      }
    }
    set({ jobId: id });
  },

  reset: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('bitelook_current_job_id');
    }
    set({
      uploadedImages: [],
      isProcessing: false,
      progress: null,
      jobId: null,
      parsedMenu: null,
      menuItems: [],
      imageGenerationCount: 0,
      selectedCategory: null,
      cart: [],
    });
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('bitelook_current_job_id');
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
      jobId: null,
      parsedMenu: null,
      menuItems: [],
      imageGenerationCount: 0,
      selectedCategory: null,
      cart: [],
    });
  },

  // Category filter actions
  setSelectedCategory: (category) => set({ selectedCategory: category }),

  // Cart actions
  addToCart: (menuItemId) =>
    set((state) => {
      const existingItem = state.cart.find((item) => item.menuItemId === menuItemId);
      if (existingItem) {
        return {
          cart: state.cart.map((item) =>
            item.menuItemId === menuItemId
              ? { ...item, quantity: item.quantity + 1 }
              : item
          ),
        };
      }
      return {
        cart: [...state.cart, { menuItemId, quantity: 1 }],
      };
    }),

  removeFromCart: (menuItemId) =>
    set((state) => ({
      cart: state.cart.filter((item) => item.menuItemId !== menuItemId),
    })),

  updateQuantity: (menuItemId, quantity) =>
    set((state) => {
      if (quantity <= 0) {
        return {
          cart: state.cart.filter((item) => item.menuItemId !== menuItemId),
        };
      }
      return {
        cart: state.cart.map((item) =>
          item.menuItemId === menuItemId ? { ...item, quantity } : item
        ),
      };
    }),

  clearCart: () => set({ cart: [] }),
}));

// ===== Selectors =====

export function parsePrice(priceStr: string | undefined): number | null {
  if (!priceStr) return null;
  const match = priceStr.match(/[\d.]+/);
  if (!match) return null;
  const num = parseFloat(match[0]);
  return isNaN(num) ? null : num;
}

export function useCategories(): string[] {
  const menuItems = useMenuStore((state) => state.menuItems);
  const categories = new Set<string>();
  menuItems.forEach((item) => {
    if (item.category) {
      categories.add(item.category);
    }
  });
  return Array.from(categories).sort();
}

export function useFilteredMenuItems(): MenuItem[] {
  const menuItems = useMenuStore((state) => state.menuItems);
  const selectedCategory = useMenuStore((state) => state.selectedCategory);

  if (!selectedCategory) {
    return menuItems;
  }

  return menuItems.filter((item) => item.category === selectedCategory);
}

export function useCartItemCount(): number {
  const cart = useMenuStore((state) => state.cart);
  return cart.reduce((total, item) => total + item.quantity, 0);
}

export function useCartTotal(): { total: number; hasUnpricedItems: boolean } {
  const cart = useMenuStore((state) => state.cart);
  const menuItems = useMenuStore((state) => state.menuItems);

  let total = 0;
  let hasUnpricedItems = false;

  cart.forEach((cartItem) => {
    const menuItem = menuItems.find((m) => m.id === cartItem.menuItemId);
    if (menuItem) {
      const price = parsePrice(menuItem.price);
      if (price !== null) {
        total += price * cartItem.quantity;
      } else {
        hasUnpricedItems = true;
      }
    }
  });

  return { total, hasUnpricedItems };
}

export function useCartItemQuantity(menuItemId: string): number {
  const cart = useMenuStore((state) => state.cart);
  const item = cart.find((i) => i.menuItemId === menuItemId);
  return item?.quantity || 0;
}
