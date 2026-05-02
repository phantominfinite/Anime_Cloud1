import { useMemo } from 'react';
import type { ReactNode } from 'react';

type Props<T> = {
  items: T[];
  columns?: number;
  rowHeight?: number;
  viewportHeight?: number;
  renderItem: (item: T, index: number) => ReactNode;
  scrollTop: number;
};

export function VirtualGrid<T>({ items, columns = 5, rowHeight = 310, viewportHeight = 740, renderItem, scrollTop }: Props<T>) {
  const totalRows = Math.ceil(items.length / columns);
  const startRow = Math.max(0, Math.floor(scrollTop / rowHeight) - 1);
  const visibleRows = Math.ceil(viewportHeight / rowHeight) + 2;
  const endRow = Math.min(totalRows, startRow + visibleRows);

  const visibleItems = useMemo(() => {
    const start = startRow * columns;
    const end = Math.min(items.length, endRow * columns);
    return items.slice(start, end).map((item, i) => ({ item, absoluteIndex: start + i }));
  }, [items, startRow, endRow, columns]);

  return (
    <div style={{ height: totalRows * rowHeight, position: 'relative' }}>
      <div style={{ transform: `translateY(${startRow * rowHeight}px)` }} className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-5">
        {visibleItems.map(({ item, absoluteIndex }) => renderItem(item, absoluteIndex))}
      </div>
    </div>
  );
}
