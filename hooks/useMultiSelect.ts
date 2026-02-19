import { useState, useCallback, useMemo } from 'react';

export function useMultiSelect<T extends string = string>(allItems?: T[]) {
  const [selected, setSelected] = useState<Set<T>>(new Set());

  const toggle = useCallback((item: T) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(item)) next.delete(item);
      else next.add(item);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    if (allItems) setSelected(new Set(allItems));
  }, [allItems]);

  const deselectAll = useCallback(() => {
    setSelected(new Set());
  }, []);

  const isSelected = useCallback((item: T) => selected.has(item), [selected]);

  const selectedArray = useMemo(() => Array.from(selected), [selected]);

  return {
    selected,
    selectedArray,
    selectedCount: selected.size,
    toggle,
    selectAll,
    deselectAll,
    isSelected,
    setSelected,
  };
}
