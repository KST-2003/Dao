import { makeStyles, media } from '@/shared/theme';

export const useStyles = makeStyles(({ colors, spacing, radius, shadows }) => ({
  gallery: { position: 'relative' },
  galleryTop: { position: 'absolute', left: spacing.gutter, right: spacing.gutter, flexDirection: 'row', justifyContent: 'space-between' },
  galleryActions: { flexDirection: 'row', gap: spacing.sm },
  counter: { position: 'absolute', right: spacing.gutter, bottom: spacing.lg, backgroundColor: media.chip, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 3 },
  thumbs: { paddingHorizontal: spacing.gutter, gap: spacing.sm, paddingVertical: spacing.md },
  thumb: { width: 52, height: 64, borderRadius: radius.sm, overflow: 'hidden', borderWidth: 1.5, borderColor: 'transparent' },
  thumbActive: { borderColor: colors.primary },
  body: { paddingHorizontal: spacing.gutter, gap: spacing.lg },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: spacing.md },
  rating: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  memberLine: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.goldSoft, alignSelf: 'flex-start', borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 4 },
  swatches: { flexDirection: 'row', gap: spacing.md },
  swatch: { width: 34, height: 34, borderRadius: 17, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  swatchRing: { borderWidth: 2, borderColor: colors.primary },
  sizes: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  review: { gap: 4, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.divider },
  bar: { flexDirection: 'row', gap: spacing.md, paddingHorizontal: spacing.gutter, paddingTop: spacing.md, backgroundColor: colors.background, borderTopWidth: 1, borderTopColor: colors.divider, ...shadows.soft },
}));
