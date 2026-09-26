import { Image } from 'expo-image';
import { View } from 'react-native';
import { DAOStar } from './DAOStar';
import { DAOText } from './DAOText';

const MARK = require('../../../assets/brand/dao-mark.png');

/** Brand mark. `variant="mark"` uses the official logo artwork; `wordmark` is the compact header form. */
export function DAOLogo({ variant = 'wordmark', size = 28 }: { variant?: 'mark' | 'wordmark'; size?: number }) {
  if (variant === 'mark') {
    return <Image source={MARK} style={{ width: size * 1.31, height: size }} contentFit="contain" accessibilityLabel="DAO" />;
  }
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start' }} accessibilityRole="header" accessibilityLabel="DAO">
      <DAOText variant="brand" style={{ fontSize: size, lineHeight: size * 1.1, letterSpacing: size * 0.08 }}>
        DAO
      </DAOText>
      <View style={{ marginLeft: 2, marginTop: 2 }}>
        <DAOStar size={size * 0.34} />
      </View>
    </View>
  );
}
