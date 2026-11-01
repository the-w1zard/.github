import    { useState, useMemo, useCallback, useEffect } from '#sauron';
import Fuse from 'fuse.js';
import { UseFuseSearchOptions, UseFuseSearchReturn } from './use-fuse-search.js';

/**
 * Custom hook for fuzzy searching using Fuse.js
 * 
 * @param data - Array of items to search through
 * @param options - Fuse.js options with sensible defaults
 * @returns Search state and methods
 * 
 * @example
 * ```tsx
 * const users = [
 *   { name: 'John Doe', email: 'john@example.com', role: 'admin' },
 *   { name: 'Jane Smith', email: 'jane@example.com', role: 'user' },
 * ];
 * 
 * const { query, results, search, clearSearch } = useDebouncedFuseSearch(users, {
 *   keys: ['name', 'email', 'role'],
 *   threshold: 0.3,
 * });
 * ```
 */

/**
 * Hook for searching with debounced input
 * Useful for real-time search as user types
 */


export function useDebouncedFuseSearch<T>(
  data: T[],
  options: UseFuseSearchOptions<T> = {},
  delay: number = 300
): UseFuseSearchReturn<T> {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Debounce the search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, delay);

    return () => clearTimeout(timer);
  }, [query, delay]);

  const fuse = useMemo(() => {
    const defaultOptions: Fuse.IFuseOptions<T> = {
      threshold: 0.4,
      distance: 100,
      minMatchCharLength: 2,
      includeScore: true,
      includeMatches: true,
      shouldSort: true,
      ignoreLocation: true,
      ...options,
    };

    return new Fuse(data, defaultOptions);
  }, [data, options]);

  const search = useCallback((searchQuery: string) => {
    setQuery(searchQuery);
  }, []);

  const clearSearch = useCallback(() => {
    setQuery('');
    setDebouncedQuery('');
  }, []);

  const results = useMemo(() => {
    if (!debouncedQuery.trim() || debouncedQuery.length < (options.minMatchCharLength || 2)) {
      return [];
    }
    return fuse.search(debouncedQuery);
  }, [fuse, debouncedQuery, options.minMatchCharLength]);

  const isSearching = query.trim().length > 0;
  const hasResults = results.length > 0;
  const isEmpty = isSearching && !hasResults;
  const totalResults = results.length;

  return {
    query,
    results,
    search,
    clearSearch,
    isSearching,
    hasResults,
    isEmpty,
    totalResults,
  };
}
/**
 * Utility function to highlight search matches
 * Use with the matches returned from Fuse.js results
 */
export function highlightMatchesDebounced(
  text: string,
  matches: readonly Fuse.FuseResultMatch[] = [],
  className: string = 'bg-yellow-200 font-semibold'
): React.ReactNode {
  if (!matches.length) return text;

  // Find matches for this specific text
  const textMatches = matches.filter(match => 
    typeof match.value === 'string' && match.value === text
  );

  if (!textMatches.length) return text;

  // Get all match indices and merge overlapping ranges
  const indices: [number, number][] = [];
  textMatches.forEach(match => {
    if (match.indices) {
      indices.push(...match.indices);
    }
  });

  if (!indices.length) return text;

  // Sort and merge overlapping indices
  const sortedIndices = indices
    .sort(([a], [b]) => a - b)
    .reduce<[number, number][]>((merged, [start, end]) => {
      if (merged.length === 0) {
        return [[start, end]];
      }

      const [lastStart, lastEnd] = merged[merged.length - 1];
      if (start <= lastEnd + 1) {
        // Merge overlapping or adjacent ranges
        merged[merged.length - 1] = [lastStart, Math.max(lastEnd, end)];
      } else {
        merged.push([start, end]);
      }
      return merged;
    }, []);

  // Create highlighted text
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;

  sortedIndices.forEach(([start, end], index) => {
    // Add text before highlight
    if (start > lastIndex) {
      parts.push(text.slice(lastIndex, start));
    }

    // Add highlighted text
    parts.push(
      <span key={index} className={className}>
        {text.slice(start, end + 1)}
      </span>
    );

    lastIndex = end + 1;
  });

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}
