import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { api } from '@/shared/api/client';
import { EXPO_PROJECT_ID } from '@/shared/constants/config';
import { palette } from '@/shared/theme/palette';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Registers this device for push. Returns false (and does nothing) when push is not
 * possible: simulator, permission denied, or no EAS project ID configured yet.
 */
export async function registerForPush(): Promise<boolean> {
  if (!Device.isDevice || !EXPO_PROJECT_ID) {
    return false;
  }
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'DAO',
      importance: Notifications.AndroidImportance.DEFAULT,
      lightColor: palette.daoSage,
    });
  }
  const current = await Notifications.getPermissionsAsync();
  const status = current.granted ? current.status : (await Notifications.requestPermissionsAsync()).status;
  if (status !== 'granted') {
    return false;
  }
  const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId: EXPO_PROJECT_ID });
  await api.post('/me/devices', { token, platform: Platform.OS === 'ios' ? 'ios' : 'android' });
  return true;
}
