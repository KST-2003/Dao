import { useLocalSearchParams } from 'expo-router';
import { useRecipe } from '../api';

export function useRecipeVideoScreen() {
  const params = useLocalSearchParams<{ id: string; t?: string }>();
  const recipe = useRecipe(Number(params.id));

  return { recipe, startAt: Math.max(0, Number(params.t) || 0) };
}
