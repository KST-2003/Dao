import { makeStyles } from '@/shared/theme';

export const useStyles = makeStyles(({ colors, spacing, radius }) => ({
  body: { flex: 1, justifyContent: 'center', gap: spacing.xxl },
  brand: { alignItems: 'center', gap: spacing.sm },
  options: { gap: spacing.md },
  option: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 64,
    paddingHorizontal: spacing.xl, borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
  },
  optionSelected: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  footer: { paddingBottom: spacing.xxxl, gap: spacing.md },
}));
