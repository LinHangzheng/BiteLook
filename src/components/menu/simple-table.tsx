'use client';

import { useFilteredMenuItems } from '@/store/menu-store';
import { DishImage } from './dish-image';
import { DietaryBadges } from './dietary-badges';
import { AddToCartButton } from './add-to-cart-button';

export function SimpleTable() {
  const menuItems = useFilteredMenuItems();

  if (menuItems.length === 0) {
    return null;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
      <table className="w-full border-collapse bg-white">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            <th className="text-left p-4 font-semibold text-slate-600 text-sm">Image</th>
            <th className="text-left p-4 font-semibold text-slate-600 text-sm">Dish</th>
            <th className="text-left p-4 font-semibold text-slate-600 text-sm hidden md:table-cell">
              Description
            </th>
            <th className="text-left p-4 font-semibold text-slate-600 text-sm hidden sm:table-cell">Diet</th>
            <th className="text-left p-4 font-semibold text-slate-600 text-sm">Price</th>
            <th className="text-left p-4 font-semibold text-slate-600 text-sm">Order</th>
          </tr>
        </thead>
        <tbody>
          {menuItems.map((item, index) => (
            <tr key={item.id} className="border-b border-slate-100 hover:bg-indigo-50/30 transition-colors">
              <td className="p-4">
                <DishImage item={item} size="sm" itemIndex={index} />
              </td>
              <td className="p-4">
                <p className="font-medium text-slate-800">{item.translatedName || item.name}</p>
                {item.translatedName && item.name !== item.translatedName && (
                  <p className="text-sm text-slate-500 italic">{item.name}</p>
                )}
                <p className="text-sm text-slate-500 md:hidden mt-1 line-clamp-2">
                  {item.translatedDescription || item.description}
                </p>
                <div className="sm:hidden mt-1">
                  <DietaryBadges labels={item.dietaryLabels} compact />
                </div>
              </td>
              <td className="p-4 text-sm text-slate-600 hidden md:table-cell max-w-md">
                <p className="line-clamp-3">{item.translatedDescription || item.description}</p>
                {item.ingredients && item.ingredients.length > 0 && (
                  <p className="text-xs text-slate-400 mt-1">
                    {item.ingredients.slice(0, 5).join(' · ')}
                  </p>
                )}
              </td>
              <td className="p-4 hidden sm:table-cell">
                <DietaryBadges labels={item.dietaryLabels} compact />
              </td>
              <td className="p-4 font-medium text-slate-800">{item.price || '-'}</td>
              <td className="p-4">
                <AddToCartButton menuItemId={item.id} compact />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
