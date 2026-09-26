import { Feather } from '@expo/vector-icons';
import { useState, type PropsWithChildren } from 'react';
import { Pressable, View } from 'react-native';
import { DAOText } from '@/shared/components';
import { useTheme } from '@/shared/theme';

/** Collapsible detail row (Description, Materials, Care, Shipping). */
export function ProductSection({ title, initiallyOpen, children }: PropsWithChildren<{ title: string; initiallyOpen?: boolean }>) {
  const [open, setOpen] = useState(!!initiallyOpen);
  const { colors, spacing } = useTheme();
  return (
    <View style={{ borderTopWidth: 1, borderTopColor: colors.divider }}>
      <Pressable accessibilityRole="button" accessibilityState={{ expanded: open }} onPress={() => setOpen((o) => !o)} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.lg }}>
        <DAOText variant="subheading">{title}</DAOText>
        <Feather name={open ? 'minus' : 'plus'} size={18} color={colors.textMuted} />
      </Pressable>
      {open ? <View style={{ paddingBottom: spacing.lg }}>{children}</View> : null}
    </View>
  );
}
