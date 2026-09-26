import { Feather } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useTheme } from '@/shared/theme';
import { DAOBottomSheet } from './DAOBottomSheet';
import { DAOText } from './DAOText';

export interface SelectOption<V extends string> {
  value: V;
  label: string;
  hint?: string;
}

interface Props<V extends string> {
  label?: string;
  value: V | null;
  options: SelectOption<V>[];
  onChange: (value: V) => void;
  placeholder?: string;
}

export function DAOSelect<V extends string>({ label, value, options, onChange, placeholder }: Props<V>) {
  const { colors, radius, spacing } = useTheme();
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);
  return (
    <View style={{ gap: spacing.xs }}>
      {label ? <DAOText variant="bodySmall" tone="textMuted">{label}</DAOText> : null}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityValue={{ text: selected?.label }}
        onPress={() => setOpen(true)}
        style={{ minHeight: 50, borderRadius: radius.md, paddingHorizontal: spacing.lg, backgroundColor: colors.surfaceMuted, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
      >
        <DAOText tone={selected ? 'text' : 'textSubtle'}>{selected?.label ?? placeholder ?? ''}</DAOText>
        <Feather name="chevron-down" size={18} color={colors.textMuted} />
      </Pressable>
      <DAOBottomSheet visible={open} onClose={() => setOpen(false)} title={label}>
        <ScrollView>
          {options.map((o) => (
            <Pressable
              key={o.value}
              accessibilityRole="radio"
              accessibilityState={{ selected: o.value === value }}
              onPress={() => {
                onChange(o.value);
                setOpen(false);
              }}
              style={{ paddingVertical: spacing.lg, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.divider }}
            >
              <View style={{ flex: 1 }}>
                <DAOText variant="bodyMedium">{o.label}</DAOText>
                {o.hint ? <DAOText variant="caption" tone="textMuted">{o.hint}</DAOText> : null}
              </View>
              {o.value === value ? <Feather name="check" size={18} color={colors.primary} /> : null}
            </Pressable>
          ))}
        </ScrollView>
      </DAOBottomSheet>
    </View>
  );
}
