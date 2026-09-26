import { makeStyles, media } from '@/shared/theme';

export const useStyles = makeStyles(({ colors, spacing, radius }) => ({
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.gutter, paddingBottom: spacing.sm },
  topActions: { flexDirection: 'row', gap: spacing.sm },
  greeting: { paddingHorizontal: spacing.gutter, marginBottom: spacing.lg },
  hero: { marginHorizontal: spacing.gutter, borderRadius: radius.xl, overflow: 'hidden', marginBottom: spacing.xxxl },
  heroText: { position: 'absolute', left: spacing.xl, right: spacing.xl, bottom: spacing.xl, gap: spacing.sm },
  heroTitle: { color: media.text, fontSize: 44, lineHeight: 48 },
  heroSub: { color: media.textMuted },
  section: { marginBottom: spacing.xxxl },
  rail: { paddingHorizontal: spacing.gutter, gap: spacing.md },
  collection: { marginHorizontal: spacing.gutter, gap: spacing.lg },
  kitchenRow: { flexDirection: 'row', paddingHorizontal: spacing.gutter, gap: spacing.md },
  kitchenCard: { backgroundColor: colors.surfaceMuted, borderRadius: radius.xl, marginHorizontal: spacing.gutter, padding: spacing.lg, gap: spacing.md },
  member: { marginHorizontal: spacing.gutter },
  join: { marginHorizontal: spacing.gutter, borderRadius: radius.xl, padding: spacing.xl, backgroundColor: colors.goldSoft, gap: spacing.md },
  orderBanner: { marginHorizontal: spacing.gutter, marginBottom: spacing.lg },
  dot: { position: 'absolute', top: 8, right: 9, width: 7, height: 7, borderRadius: 4, backgroundColor: colors.accent },
}));
