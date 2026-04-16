'use client';

import { useMenuStore, useCategories } from '@/store/menu-store';

export function CategoryFilter() {
  const selectedCategory = useMenuStore((state) => state.selectedCategory);
  const setSelectedCategory = useMenuStore((state) => state.setSelectedCategory);
  const categories = useCategories();

  if (categories.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="category-filter" className="text-sm font-medium text-gray-600">
        Filter by Category:
      </label>
      <select
        id="category-filter"
        value={selectedCategory || ''}
        onChange={(e) => setSelectedCategory(e.target.value || null)}
        className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
      >
        <option value="">All Categories</option>
        {categories.map((category) => (
          <option key={category} value={category}>
            {category}
          </option>
        ))}
      </select>
    </div>
  );
}
