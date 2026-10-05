import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useErrorMessage } from '@/shared/hooks/useErrorMessage';
import { toast } from '@/shared/store/toastStore';
import { useMe, useUpdateAvatar, useUpdateProfile } from '../../auth/api';

export function useEditProfileScreen() {
  const { t } = useTranslation();
  const me = useMe();
  const update = useUpdateProfile();
  const avatar = useUpdateAvatar();
  const message = useErrorMessage();
  const [name, setName] = useState(me.data?.display_name ?? me.data?.name ?? '');

  const pickPhoto = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      toast.error(t('profile.photoPermissionDenied'));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) {
      return;
    }
    const asset = result.assets[0];
    // The presign endpoint only accepts these three — anything else (e.g. HEIC) falls back to jpeg.
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    const contentType = allowed.includes(asset.mimeType ?? '') ? (asset.mimeType as string) : 'image/jpeg';
    avatar.mutate({ uri: asset.uri, contentType }, { onError: (e) => toast.error(message(e)) });
  };

  const save = () => {
    update.mutate(
      { display_name: name.trim() || null, name: me.data?.name ?? (name.trim() || null) },
      { onSuccess: () => router.back(), onError: (e) => toast.error(message(e)) },
    );
  };

  return {
    user: me.data,
    name,
    setName,
    pickPhoto,
    uploadingPhoto: avatar.isPending,
    save,
    saving: update.isPending,
  };
}
