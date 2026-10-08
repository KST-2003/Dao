import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { FlatList, Share } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAddToCart } from '@/features/cart/api';
import { useErrorMessage } from '@/shared/hooks/useErrorMessage';
import { useRequireAuth } from '@/shared/hooks/useRequireAuth';
import { useIsSaved } from '@/shared/store/savedStore';
import { toast } from '@/shared/store/toastStore';
import { useProduct, useRelatedProducts, useReviews, useToggleSaved } from '../api';

export function useProductScreen() {
  const { t } = useTranslation();
  const id = Number(useLocalSearchParams<{ id: string }>().id);
  const product = useProduct(id);
  const related = useRelatedProducts(id);
  const reviews = useReviews(id);
  const add = useAddToCart();
  const toggleSaved = useToggleSaved();
  const requireAuth = useRequireAuth();
  const message = useErrorMessage();
  const saved = useIsSaved('product', id, product.data?.is_saved ?? false);
  const [color, setColor] = useState<string | null>(null);
  const [size, setSize] = useState<string | null>(null);
  const [sizeGuide, setSizeGuide] = useState(false);
  const [imageIndex, setImageIndex] = useState(0);
  const galleryRef = useRef<FlatList>(null);
  const selectImage = (index: number) => {
    setImageIndex(index);
    galleryRef.current?.scrollToIndex({ index, animated: true });
  };

  const p = product.data;
  const variants = p?.variants ?? [];
  const colors = [...new Map(variants.filter((v) => v.color).map((v) => [v.color!, { name: v.color!, hex: v.color_hex }])).values()];
  const activeColor = color ?? colors[0]?.name ?? null;
  const needsSize = variants.some((v) => v.size);
  const variant = variants.find((v) => (v.color ?? null) === (activeColor ?? v.color ?? null) && (!needsSize || v.size === size)) ?? (!needsSize && variants.length === 1 ? variants[0] : undefined);
  const sizeState = (s: string) => variants.find((v) => v.size === s && (v.color ?? null) === (activeColor ?? v.color ?? null))?.stock_status ?? 'out_of_stock';
  const images = p ? (activeColor ? [...p.images].sort((a, b) => Number(b.color === activeColor) - Number(a.color === activeColor)) : p.images) : [];

  const addToCart = (then?: () => void) => {
    if (!variant) {
      toast.show(needsSize && !size ? t('shop.selectSize') : t('shop.selectColor'));
      return;
    }
    add.mutate(
      { variantId: variant.id, quantity: 1, productId: id },
      {
        onSuccess: () => {
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
          if (then) then();
          else toast.success(t('shop.addedToCart'), { label: t('shop.viewBag'), onPress: () => router.push('/cart') });
        },
        onError: (e) => toast.error(message(e)),
      },
    );
  };

  return {
    product, related, reviews, p, images, imageIndex, setImageIndex, galleryRef, selectImage,
    colors, activeColor, setColor, sizes: p?.sizes ?? [], size, setSize, sizeState, variant, needsSize,
    saved, toggleSave: () => toggleSaved('product', id, saved),
    sizeGuide, openSizeGuide: () => setSizeGuide(true), closeSizeGuide: () => setSizeGuide(false),
    adding: add.isPending,
    addToCart: requireAuth(() => addToCart()),
    buyNow: requireAuth(() => addToCart(() => router.push('/checkout'))),
    share: () => void Share.share({ message: `${p?.name ?? 'DAO'} ✦ dao://product/${id}` }),
    openExternal: p?.external_url ?? null,
  };
}
