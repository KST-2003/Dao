import { View } from 'react-native';
import { useTheme } from '@/shared/theme';
import { DAOImage } from './DAOImage';
import { DAOText } from './DAOText';

export function DAOAvatar({ uri, name, size = 48 }: { uri?: string | null; name?: string | null; size?: number }) {
  const { colors } = useTheme();
  const initials = (name ?? 'D').trim().split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  if (uri) {
    return <DAOImage uri={uri} style={{ width: size, height: size, borderRadius: size / 2 }} accessibilityLabel={name ?? undefined} />;
  }
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }} accessibilityLabel={name ?? undefined}>
      <DAOText variant="subheading" tone="primary">{initials}</DAOText>
    </View>
  );
}
