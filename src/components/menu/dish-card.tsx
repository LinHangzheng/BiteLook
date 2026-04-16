import type { MenuItem } from '@/types/menu';
import { DishImage } from './dish-image';
import { DietaryBadges } from './dietary-badges';
import { AddToCartButton } from './add-to-cart-button';

interface DishCardProps {
  item: MenuItem;
}

export function DishCard({ item }: DishCardProps) {
  return (
    <div className="flex gap-4 p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
      <DishImage item={item} size="md" />
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start gap-2">
          <div className="min-w-0">
            <h4 className="font-serif font-semibold text-amber-900 truncate">
              {item.translatedName || item.name}
            </h4>
            {item.translatedName && item.name !== item.translatedName && (
              <p className="text-xs text-amber-600 italic truncate">{item.name}</p>
            )}
          </div>
          {item.price && (
            <span className="font-semibold text-amber-800 whitespace-nowrap">{item.price}</span>
          )}
        </div>
        <DietaryBadges labels={item.dietaryLabels} />
        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
          {item.translatedDescription || item.description}
        </p>
        {item.ingredients && item.ingredients.length > 0 && (
          <p className="text-xs text-gray-400 mt-2 truncate">
            {item.ingredients.slice(0, 5).join(' · ')}
          </p>
        )}
        <div className="mt-2">
          <AddToCartButton menuItemId={item.id} />
        </div>
      </div>
    </div>
  );
}
