'use client';

import { useMenuStore, useCartItemQuantity } from '@/store/menu-store';

interface AddToCartButtonProps {
  menuItemId: string;
  compact?: boolean;
}

export function AddToCartButton({ menuItemId, compact = false }: AddToCartButtonProps) {
  const addToCart = useMenuStore((state) => state.addToCart);
  const updateQuantity = useMenuStore((state) => state.updateQuantity);
  const quantity = useCartItemQuantity(menuItemId);

  if (quantity === 0) {
    return (
      <button
        onClick={() => addToCart(menuItemId)}
        className={`${
          compact ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm'
        } bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition-colors`}
      >
        Add
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => updateQuantity(menuItemId, quantity - 1)}
        className={`${
          compact ? 'w-6 h-6 text-xs' : 'w-8 h-8 text-sm'
        } flex items-center justify-center bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-lg transition-colors`}
      >
        -
      </button>
      <span className={`${compact ? 'w-6 text-xs' : 'w-8 text-sm'} text-center font-medium text-gray-800`}>
        {quantity}
      </span>
      <button
        onClick={() => addToCart(menuItemId)}
        className={`${
          compact ? 'w-6 h-6 text-xs' : 'w-8 h-8 text-sm'
        } flex items-center justify-center bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition-colors`}
      >
        +
      </button>
    </div>
  );
}
