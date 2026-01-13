import type { MenuItem } from '@/types/menu';

interface DishImageProps {
  item: MenuItem;
  size: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'w-16 h-16',
  md: 'w-24 h-24',
  lg: 'w-32 h-32',
};

export function DishImage({ item, size }: DishImageProps) {
  if (!item.generatedImageBase64) {
    return (
      <div
        className={`${sizeClasses[size]} rounded-lg bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center animate-pulse`}
      >
        <span className="text-2xl opacity-50">🍽️</span>
      </div>
    );
  }

  return (
    <img
      src={`data:image/png;base64,${item.generatedImageBase64}`}
      alt={item.translatedName || item.name}
      className={`${sizeClasses[size]} rounded-lg object-cover shadow-sm`}
    />
  );
}
