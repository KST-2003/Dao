import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useToggleSaved } from '@/features/shop/api';
import { useContentProtection } from '@/shared/hooks/useContentProtection';
import { useIsSaved } from '@/shared/store/savedStore';
import { useRecipe } from '../api';

export function useRecipeScreen() {
  const id = Number(useLocalSearchParams<{ id: string }>().id);
  useContentProtection(`recipe-${id}`);
  const recipe = useRecipe(id);
  const toggleSaved = useToggleSaved();
  const saved = useIsSaved('recipe', id, recipe.data?.is_saved ?? false);
  const [tab, setTab] = useState<'ingredients' | 'steps'>('ingredients');
  const [done, setDone] = useState<number[]>([]);

  return {
    recipe,
    tab,
    setTab,
    saved,
    toggleSave: () => toggleSaved('recipe', id, saved),
    stepDone: (n: number) => done.includes(n),
    toggleStep: (n: number) => setDone((d) => (d.includes(n) ? d.filter((x) => x !== n) : [...d, n])),
    watch: () => recipe.data?.video && router.push({ pathname: '/video/[id]', params: { id: String(recipe.data.video.id) } }),
    shopIngredient: (productId: number) => router.push({ pathname: '/product/[id]', params: { id: String(productId) } }),
  };
}
