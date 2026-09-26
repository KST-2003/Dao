import { Feather } from '@expo/vector-icons';
import { forwardRef } from 'react';
import { TextInput, View, type TextInputProps } from 'react-native';
import { useTheme } from '@/shared/theme';
import { DAOText } from './DAOText';

export interface DAOInputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  icon?: keyof typeof Feather.glyphMap;
}

export const DAOInput = forwardRef<TextInput, DAOInputProps>(function DAOInput({ label, error, hint, icon, style, ...rest }, ref) {
  const { colors, radius, spacing, typography } = useTheme();
  return (
    <View style={{ gap: spacing.xs }}>
      {label ? <DAOText variant="bodySmall" tone="textMuted">{label}</DAOText> : null}
      <View
        style={{
          flexDirection: 'row', alignItems: 'center', minHeight: 50, borderRadius: radius.md, paddingHorizontal: spacing.lg,
          backgroundColor: colors.surfaceMuted, borderWidth: 1, borderColor: error ? colors.danger : 'transparent',
        }}
      >
        {icon ? <Feather name={icon} size={17} color={colors.textMuted} style={{ marginRight: spacing.sm }} /> : null}
        <TextInput
          ref={ref}
          placeholderTextColor={colors.textSubtle}
          accessibilityLabel={label ?? rest.placeholder}
          style={[typography.body, { flex: 1, color: colors.text, paddingVertical: spacing.md }, style]}
          maxFontSizeMultiplier={1.4}
          {...rest}
        />
      </View>
      {error ? <DAOText variant="caption" tone="danger">{error}</DAOText> : hint ? <DAOText variant="caption" tone="textSubtle">{hint}</DAOText> : null}
    </View>
  );
});
