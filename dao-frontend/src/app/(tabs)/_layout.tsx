import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { DAOTabBar } from '@/shared/components';

/** Home · Shop · Vlog · Kitchen · Me — Shop is the commercial center of gravity. */
export default function TabsLayout() {
  const { t } = useTranslation();
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <DAOTabBar {...props} />}>
      <Tabs.Screen name="index" options={{ title: t('common.home') }} />
      <Tabs.Screen name="shop" options={{ title: t('common.shop') }} />
      <Tabs.Screen name="vlog" options={{ title: t('common.vlog') }} />
      <Tabs.Screen name="kitchen" options={{ title: t('common.kitchen') }} />
      <Tabs.Screen name="me" options={{ title: t('common.me') }} />
    </Tabs>
  );
}
