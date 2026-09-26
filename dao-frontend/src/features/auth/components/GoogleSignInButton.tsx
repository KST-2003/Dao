import * as Google from 'expo-auth-session/providers/google';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { DAOButton } from '@/shared/components';
import { GOOGLE_CLIENT_IDS } from '@/shared/constants/config';

/** Rendered only when Google client IDs are configured (the hook requires them). */
export function GoogleSignInButton({ onIdToken, loading }: { onIdToken: (idToken: string) => void; loading?: boolean }) {
  const { t } = useTranslation();
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    iosClientId: GOOGLE_CLIENT_IDS.ios || undefined,
    androidClientId: GOOGLE_CLIENT_IDS.android || undefined,
    webClientId: GOOGLE_CLIENT_IDS.web || undefined,
  });

  useEffect(() => {
    if (response?.type === 'success' && response.params.id_token) {
      onIdToken(response.params.id_token);
    }
  }, [response, onIdToken]);

  return (
    <DAOButton label={t('auth.continueWithGoogle')} icon="globe" variant="secondary" size="lg" fullWidth loading={loading} disabled={!request} onPress={() => void promptAsync()} />
  );
}
