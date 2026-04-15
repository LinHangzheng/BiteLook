'use client';

import type { MenuItem } from '@/types/menu';
import { useMenuStore } from '@/store/menu-store';

interface DishImageProps {
  item: MenuItem;
  size: 'sm' | 'md' | 'lg';
  itemIndex: number;
}

const sizeClasses = {
  sm: 'w-16 h-16',
  md: 'w-24 h-24',
  lg: 'w-32 h-32',
};

export function DishImage({ item, size, itemIndex }: DishImageProps) {
  const generateImageForItem = useMenuStore((state) => state.generateImageForItem);
  const imageGenerationCount = useMenuStore((state) => state.imageGenerationCount);
  const imageGenerationLimit = useMenuStore((state) => state.imageGenerationLimit);

  const limitReached = imageGenerationCount >= imageGenerationLimit;

  // Show generated image
  if (item.generatedImageBase64) {
    return (
      <img
        src={`data:image/png;base64,${item.generatedImageBase64}`}
        alt={item.translatedName || item.name}
        className={`${sizeClasses[size]} rounded-lg object-cover shadow-sm`}
      />
    );
  }

  // Loading state
  if (item.imageGenerationStatus === 'loading') {
    return (
      <div
        className={`${sizeClasses[size]} rounded-lg bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center`}
      >
        <svg className="animate-spin h-5 w-5 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
    );
  }

  // Error state
  if (item.imageGenerationStatus === 'error') {
    return (
      <button
        onClick={() => generateImageForItem(itemIndex)}
        disabled={limitReached}
        className={`${sizeClasses[size]} rounded-lg bg-red-50 border border-red-200 flex flex-col items-center justify-center gap-1 transition-colors ${
          limitReached ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-100 cursor-pointer'
        }`}
      >
        <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        <span className="text-[10px] text-red-500 font-medium">Retry</span>
      </button>
    );
  }

  // Idle state - show generate button
  return (
    <button
      onClick={() => generateImageForItem(itemIndex)}
      disabled={limitReached}
      className={`${sizeClasses[size]} rounded-lg bg-indigo-50 border border-indigo-200 flex flex-col items-center justify-center gap-1 transition-all ${
        limitReached
          ? 'opacity-40 cursor-not-allowed'
          : 'hover:bg-indigo-100 hover:border-indigo-300 cursor-pointer hover:shadow-sm'
      }`}
    >
      <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
      </svg>
      <span className="text-[10px] text-indigo-500 font-medium">
        {limitReached ? 'Limit' : 'Generate'}
      </span>
    </button>
  );
}
