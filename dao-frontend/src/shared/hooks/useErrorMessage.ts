import { useTranslation } from 'react-i18next';
import { ApiError } from '@/shared/api/errors';

/** Human message for any error: server-translated message → network message → generic. */
export function useErrorMessage(): (error: unknown) => string {
  const { t } = useTranslation();
  return (error: unknown) => {
    if (error instanceof ApiError) {
      if (error.isNetwork) {
        return t('errors.network');
      }
      if (error.status >= 500) {
        return t('errors.generic');
      }
      return error.message || t('errors.generic');
    }
    return t('errors.generic');
  };
}
