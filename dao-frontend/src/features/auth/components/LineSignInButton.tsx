import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { DAOButton } from '@/shared/components';
import { lineRedirectUri, useLineAuthRequest } from '../socialAuth';

interface Props {
  onCode: (vars: { code: string; code_verifier: string; redirect_uri: string }) => void;
  loading?: boolean;
}

export function LineSignInButton({ onCode, loading }: Props) {
  const { t } = useTranslation();
  const [request, response, promptAsync] = useLineAuthRequest();

  useEffect(() => {
    if (response?.type === 'success' && response.params.code && request?.codeVerifier) {
      onCode({ code: response.params.code, code_verifier: request.codeVerifier, redirect_uri: lineRedirectUri });
    }
  }, [response, request, onCode]);

  return (
    <DAOButton label={t('auth.continueWithLine')} icon="message-circle" variant="secondary" size="lg" fullWidth loading={loading} disabled={!request} onPress={() => void promptAsync()} />
  );
}
