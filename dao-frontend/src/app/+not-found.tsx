import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { DAOEmptyState, DAOHeader, DAOScreen } from '@/shared/components';

export default function NotFound() {
  const { t } = useTranslation();
  return (
    <DAOScreen header={<DAOHeader />}>
      <DAOEmptyState title={t('common.somethingWentWrong')} actionLabel={t('common.home')} onAction={() => router.replace('/(tabs)')} />
    </DAOScreen>
  );
}
