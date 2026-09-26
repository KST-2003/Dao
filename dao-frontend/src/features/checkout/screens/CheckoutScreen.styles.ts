import { makeStyles } from '@/shared/theme';

export const useStyles = makeStyles(({ colors, spacing, radius }) => ({
  section: { gap: spacing.md, marginBottom: spacing.xl },
  option: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  optionActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  footer: { paddingHorizontal: spacing.gutter, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.divider, backgroundColor: colors.background, gap: spacing.sm },
}));
