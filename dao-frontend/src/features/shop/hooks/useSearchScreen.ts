import { useEffect, useState } from 'react';
import { usePrefsStore } from '@/shared/store/prefsStore';
import { useSearch, useToggleSaved } from '../api';

export function useSearchScreen() {
  const [text, setText] = useState('');
  const [query, setQuery] = useState('');
  const recent = usePrefsStore((s) => s.recentSearches);
  const addRecent = usePrefsStore((s) => s.addRecentSearch);
  const clearRecent = usePrefsStore((s) => s.clearRecentSearches);
  const results = useSearch(query);
  const toggleSaved = useToggleSaved();

  // Debounce typing → query
  useEffect(() => {
    const timer = setTimeout(() => setQuery(text.trim()), 300);
    return () => clearTimeout(timer);
  }, [text]);

  const submit = (value = text) => {
    const q = value.trim();
    if (q) {
      setText(q);
      setQuery(q);
      addRecent(q);
    }
  };

  const r = results.data;
  const empty = !!r && r.products.length + r.collections.length + r.videos.length + r.recipes.length === 0;

  return { text, setText, query, submit, recent, clearRecent, results, empty, toggleSaved };
}
