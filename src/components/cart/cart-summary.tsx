'use client';

import { useState } from 'react';
import { useMenuStore, useCartTotal, useCartItemCount, parsePrice } from '@/store/menu-store';

export function CartSummary() {
  const [isExpanded, setIsExpanded] = useState(false);
  const cart = useMenuStore((state) => state.cart);
  const menuItems = useMenuStore((state) => state.menuItems);
  const clearCart = useMenuStore((state) => state.clearCart);
  const updateQuantity = useMenuStore((state) => state.updateQuantity);
  const { total, hasUnpricedItems } = useCartTotal();
  const itemCount = useCartItemCount();

  if (cart.length === 0) {
    return null;
  }

  const cartWithDetails = cart.map((cartItem) => {
    const menuItem = menuItems.find((m) => m.id === cartItem.menuItemId);
    return {
      ...cartItem,
      menuItem,
      price: menuItem ? parsePrice(menuItem.price) : null,
    };
  });

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Collapsed view - just summary */}
      {!isExpanded && (
        <button
          onClick={() => setIsExpanded(true)}
          className="flex items-center gap-3 px-4 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl shadow-lg transition-all"
        >
          <span className="text-xl">🛒</span>
          <span className="font-medium">{itemCount} items</span>
          <span className="font-bold">${total.toFixed(2)}</span>
        </button>
      )}

      {/* Expanded view - full cart */}
      {isExpanded && (
        <div className="bg-white rounded-xl shadow-2xl border border-gray-200 w-80 max-h-96 overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-orange-50 border-b border-gray-200">
            <h3 className="font-semibold text-gray-800">Your Order</h3>
            <button
              onClick={() => setIsExpanded(false)}
              className="text-gray-500 hover:text-gray-700 text-xl"
            >
              ×
            </button>
          </div>

          {/* Items */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {cartWithDetails.map(({ menuItemId, quantity, menuItem, price }) => (
              <div
                key={menuItemId}
                className="flex items-center justify-between gap-2 p-2 bg-gray-50 rounded-lg"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {menuItem?.translatedName || menuItem?.name || 'Unknown item'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {price !== null ? `$${price.toFixed(2)} each` : 'Market price'}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => updateQuantity(menuItemId, quantity - 1)}
                    className="w-6 h-6 flex items-center justify-center bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm rounded transition-colors"
                  >
                    -
                  </button>
                  <span className="w-6 text-center text-sm font-medium">{quantity}</span>
                  <button
                    onClick={() => updateQuantity(menuItemId, quantity + 1)}
                    className="w-6 h-6 flex items-center justify-center bg-orange-500 hover:bg-orange-600 text-white text-sm rounded transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 p-3 bg-gray-50">
            <div className="flex justify-between items-center mb-3">
              <span className="text-gray-600">Total:</span>
              <div className="text-right">
                <span className="text-lg font-bold text-gray-800">${total.toFixed(2)}</span>
                {hasUnpricedItems && (
                  <p className="text-xs text-amber-600">+ market price items</p>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={clearCart}
                className="flex-1 px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm font-medium rounded-lg transition-colors"
              >
                Clear
              </button>
              <button
                onClick={() => setIsExpanded(false)}
                className="flex-1 px-3 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Done
              </button>
            </div>
            <p className="text-xs text-gray-400 text-center mt-2">
              Prices are estimates. Verify with restaurant.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
