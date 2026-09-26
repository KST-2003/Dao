import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { DAOBottomSheet, DAOText } from '@/shared/components';
import { useTheme } from '@/shared/theme';

/** Generic DAO size chart (cm). Product-specific charts can be added as variant attributes later. */
const ROWS = [
  ['XS', '78–82', '60–64', '84–88'],
  ['S', '82–86', '64–68', '88–92'],
  ['M', '86–90', '68–72', '92–96'],
  ['L', '90–96', '72–78', '96–102'],
  ['XL', '96–102', '78–84', '102–108'],
];

export function SizeGuideSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const { colors, spacing } = useTheme();
  return (
    <DAOBottomSheet visible={visible} onClose={onClose} title={t('shop.sizeGuide')}>
      <View style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 12, overflow: 'hidden', marginBottom: spacing.lg }}>
        {[['', 'Bust', 'Waist', 'Hip'], ...ROWS].map((row, i) => (
          <View key={row[0] || 'head'} style={{ flexDirection: 'row', backgroundColor: i === 0 ? colors.surfaceMuted : colors.surface, borderTopWidth: i ? 1 : 0, borderTopColor: colors.divider }}>
            {row.map((cell, j) => (
              <DAOText key={j} variant={i === 0 || j === 0 ? 'bodyMedium' : 'bodySmall'} align="center" style={{ flex: 1, paddingVertical: spacing.md }}>{cell}</DAOText>
            ))}
          </View>
        ))}
      </View>
    </DAOBottomSheet>
  );
}
