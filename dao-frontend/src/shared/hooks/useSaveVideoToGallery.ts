import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library';
import { useState } from 'react';
import { i18n } from '@/shared/i18n';
import { toast } from '@/shared/store/toastStore';

/** Downloads a video URL to the device and saves it into the gallery/Photos, with progress. */
export function useSaveVideoToGallery() {
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState(0);

  const save = async (url: string): Promise<void> => {
    setSaving(true);
    setProgress(0);
    try {
      const permission = await MediaLibrary.requestPermissionsAsync(true); // write-only: we never read the gallery
      if (!permission.granted) {
        toast.error(i18n.t('vlog.downloadGalleryPermission'));
        return;
      }

      const ext = url.split('?')[0]?.split('.').pop() || 'mp4';
      const dest = `${FileSystem.cacheDirectory}dao-${Date.now()}.${ext}`;
      const download = FileSystem.createDownloadResumable(url, dest, {}, ({ totalBytesWritten, totalBytesExpectedToWrite }) => {
        if (totalBytesExpectedToWrite > 0) {
          setProgress(Math.round((totalBytesWritten / totalBytesExpectedToWrite) * 100));
        }
      });
      const result = await download.downloadAsync();
      if (!result) {
        throw new Error('download failed');
      }

      await MediaLibrary.saveToLibraryAsync(result.uri);
      await FileSystem.deleteAsync(result.uri, { idempotent: true }); // gallery has its own copy now
      toast.success(i18n.t('vlog.downloaded'));
    } catch {
      toast.error(i18n.t('errors.generic'));
    } finally {
      setSaving(false);
      setProgress(0);
    }
  };

  return { saving, progress, save };
}
