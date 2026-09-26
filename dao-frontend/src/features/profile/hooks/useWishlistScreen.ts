import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useToggleSaved } from '@/features/shop/api';
import type { SaveableType } from '@/types/enums';
import { useSavedList } from '../api';

export function useWishlistScreen() {
  const params = useLocalSearchParams<{ tab?: SaveableType }>();
  const [tab, setTab] = useState<SaveableType>(params.tab ?? 'product');
  const products = useSavedList('product');
  const videos = useSavedList('video');
  const recipes = useSavedList('recipe');
  const toggleSaved = useToggleSaved();
  return { tab, setTab, products, videos, recipes, toggleSaved };
}
