import { makeStyles } from '@/shared/theme';

export const useStyles = makeStyles(({ spacing, radius }) => ({
  root: { flex: 1 },
  slide: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xxxl, gap: spacing.xl },
  circle: { width: 220, height: 220, borderRadius: 110, alignItems: 'center', justifyContent: 'center' },
  footer: { paddingHorizontal: spacing.gutter, gap: spacing.lg, alignItems: 'center' },
  dots: { flexDirection: 'row', gap: spacing.sm },
  dot: { width: 6, height: 6, borderRadius: radius.pill },
  dotActive: { width: 22 },
  skip: { position: 'absolute', right: spacing.gutter, zIndex: 2 },
}));
