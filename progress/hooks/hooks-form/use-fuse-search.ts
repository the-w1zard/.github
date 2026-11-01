// ~/hooks/use-fuse-search.ts
import { useState, useMemo, useCallback } from '#sauron';
import Fuse, { type IFuseOptions, type FuseResultMatch } from 'fuse.js';

export interface UseFuseSearchOptions<T> extends IFuseOptions<T> {
  threshold?: number;
  distance?: number;
  minMatchCharLength?: number;
}

export interface SearchResult<T> {
  item: T;
  refIndex: number;
  score?: number;
  matches?: readonly FuseResultMatch[];
}

export interface UseFuseSearchReturn<T> {
  query: string;
  results: T[];
  search: (searchQuery: string) => void;
  clearSearch: () => void;
  isSearching: boolean;
  hasResults: boolean;
  isEmpty: boolean;
  totalResults: number;
  rawResults: SearchResult<T>[];
}

export function useFuseSearch<T>(
  data: T[],
  options: UseFuseSearchOptions<T> = {}
): UseFuseSearchReturn<T> {
  const [query, setQuery] = useState('');

  const fuse = useMemo(() => {
    const defaultOptions: IFuseOptions<T> = {
      threshold: 0.4,
      distance: 100,
      minMatchCharLength: 2,
      includeScore: true,
      includeMatches: true,
      shouldSort: true,
      findAllMatches: false,
      location: 0,
      ignoreLocation: true,
      ignoreFieldNorm: false,
      fieldNormWeight: 1,
      ...options,
    };

    return new Fuse(data, defaultOptions);
  }, [data, options]);

  const search = useCallback((searchQuery: string) => {
    setQuery(searchQuery);
  }, []);

  const clearSearch = useCallback(() => {
    setQuery('');
  }, []);

  const rawResults = useMemo(() => {
    if (!query.trim() || query.length < (options.minMatchCharLength || 2)) {
      return [];
    }
    return fuse.search(query);
  }, [fuse, query, options.minMatchCharLength]);

  const results = useMemo(() => {
    if (!query.trim() || query.length < (options.minMatchCharLength || 2)) {
      return data;
    }
    return rawResults.map(result => result.item);
  }, [rawResults, query, data, options.minMatchCharLength]);

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
    rawResults,
  };
}

export function highlightMatches(
  text: string,
  matches: readonly FuseResultMatch[] = [],
  className: string = 'bg-yellow-200 font-semibold'
): React.ReactNode {
  if (!matches.length) return text;

  const textMatches = matches.filter(match => 
    typeof match.value === 'string' && match.value === text
  );

  if (!textMatches.length) return text;

  const indices: [number, number][] = [];
  textMatches.forEach(match => {
    if (match.indices) {
      indices.push(...match.indices);
    }
  });

  if (!indices.length) return text;

  const sortedIndices = indices
    .sort(([a], [b]) => a - b)
    .reduce<[number, number][]>((merged, [start, end]) => {
      if (merged.length === 0) {
        return [[start, end]];
      }

      const [lastStart, lastEnd] = merged[merged.length - 1];
      if (start <= lastEnd + 1) {
        merged[merged.length - 1] = [lastStart, Math.max(lastEnd, end)];
      } else {
        merged.push([start, end]);
      }
      return merged;
    }, []);

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;

  sortedIndices.forEach(([start, end], index) => {
    if (start > lastIndex) {
      parts.push(text.slice(lastIndex, start));
    }

    parts.push(
      <span key={index} className={className}>
        {text.slice(start, end + 1)}
      </span>
    );

    lastIndex = end + 1;
  });

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}
