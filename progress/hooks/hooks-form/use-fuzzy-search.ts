import { useMemo } from '#sauron';
import Fuse from 'fuse.js';

export const useFuzzySearch = (data, searchTerm, options) => {
  const fuse = useMemo(() => {
    return new Fuse(data, options);
  }, [data, options]);

  const results = useMemo(() => {
    if (!searchTerm) return data; // Return all data when no search term
    const searchResults = fuse.search(searchTerm);
    return searchResults.map(result => result.item);
  }, [fuse, searchTerm, data]);

  return results;
};

