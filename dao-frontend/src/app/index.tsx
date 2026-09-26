import { Redirect } from 'expo-router';
import { usePrefsStore } from '@/shared/store/prefsStore';

/** Entry gate: language (first run) → onboarding (first run) → app. */
export default function Index() {
  const hasChosenLanguage = usePrefsStore((s) => s.hasChosenLanguage);
  const hasOnboarded = usePrefsStore((s) => s.hasOnboarded);
  if (!hasChosenLanguage) {
    return <Redirect href="/language" />;
  }
  if (!hasOnboarded) {
    return <Redirect href="/onboarding" />;
  }
  return <Redirect href="/(tabs)" />;
}
