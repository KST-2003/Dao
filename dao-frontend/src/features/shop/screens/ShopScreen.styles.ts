import { makeStyles } from '@/shared/theme';

export const useStyles = makeStyles(({ colors, spacing, radius }) => ({
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.gutter },
  search: { marginHorizontal: spacing.gutter, marginTop: spacing.md, height: 46, borderRadius: radius.pill, backgroundColor: colors.surfaceMuted, flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, gap: spacing.sm },
  chips: { paddingHorizontal: spacing.gutter, gap: spacing.sm, paddingVertical: spacing.lg },
  collections: { paddingHorizontal: spacing.gutter, gap: spacing.md, paddingBottom: spacing.xl },
}));
