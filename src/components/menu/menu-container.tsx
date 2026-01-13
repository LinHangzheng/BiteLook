'use client';

import { useMenuStore } from '@/store/menu-store';
import { SimpleTable } from './simple-table';
import { FancyMenu } from './fancy-menu';

export function MenuContainer() {
  const displayMode = useMenuStore((state) => state.displayMode);

  return displayMode === 'simple' ? <SimpleTable /> : <FancyMenu />;
}
