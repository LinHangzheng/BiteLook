'use client';

import { useMenuStore } from '@/store/menu-store';
import type { DisplayMode } from '@/types/menu';

const formats: { value: DisplayMode; label: string; description: string; icon: string }[] = [
  {
    value: 'simple',
    label: 'Simple Table',
    description: 'Clean, easy-to-read table format with all details',
    icon: '📋',
  },
  {
    value: 'fancy',
    label: 'Elegant Menu',
    description: 'Styled like a premium restaurant menu',
    icon: '✨',
  },
];

export function FormatSelector() {
  const { displayMode, setDisplayMode } = useMenuStore();

  return (
    <div className="grid grid-cols-2 gap-4">
      {formats.map((format) => (
        <button
          key={format.value}
          onClick={() => setDisplayMode(format.value)}
          className={`
            p-4 rounded-xl border-2 text-left transition-all duration-200
            ${
              displayMode === format.value
                ? 'border-orange-500 bg-orange-50 shadow-md'
                : 'border-gray-200 hover:border-orange-300 hover:bg-orange-50/30'
            }
          `}
        >
          <div className="text-2xl mb-2">{format.icon}</div>
          <p className="font-semibold text-gray-800">{format.label}</p>
          <p className="text-sm text-gray-500 mt-1">{format.description}</p>
        </button>
      ))}
    </div>
  );
}
