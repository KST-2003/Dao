import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { LINE_CHANNEL_ID } from '@/shared/constants/config';

WebBrowser.maybeCompleteAuthSession();

/** LINE Login (OAuth 2.1 + PKCE). The code is exchanged by the backend, which holds the channel secret. */
export const lineDiscovery: AuthSession.DiscoveryDocument = {
  authorizationEndpoint: 'https://access.line.me/oauth2/v2.1/authorize',
  tokenEndpoint: 'https://api.line.me/oauth2/v2.1/token',
};

export const lineRedirectUri = AuthSession.makeRedirectUri({ scheme: 'dao', path: 'auth/line' });

export function useLineAuthRequest() {
  return AuthSession.useAuthRequest(
    {
      clientId: LINE_CHANNEL_ID || 'not-configured',
      scopes: ['profile', 'openid', 'email'],
      redirectUri: lineRedirectUri,
      usePKCE: true,
      responseType: AuthSession.ResponseType.Code,
      extraParams: { bot_prompt: 'normal' },
    },
    lineDiscovery,
  );
}
