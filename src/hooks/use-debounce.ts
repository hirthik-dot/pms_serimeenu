// =============================================================================
// useDebounce Hook
// =============================================================================

import { useEffect, useState } from 'react';

/**
 * Debounce a value by the specified delay.
 * Commonly used for search input debouncing (300ms).
 */
export function useDebounce<T>(value: T, delay = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
