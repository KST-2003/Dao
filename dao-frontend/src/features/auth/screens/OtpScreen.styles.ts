import { makeStyles } from '@/shared/theme';

export const useStyles = makeStyles(({ colors, spacing, radius }) => ({
  body: { gap: spacing.xl, marginTop: spacing.lg },
  boxes: { flexDirection: 'row', justifyContent: 'space-between' },
  box: { width: 48, height: 58, borderRadius: radius.md, backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'transparent' },
  boxActive: { borderColor: colors.primary },
  hiddenInput: { position: 'absolute', opacity: 0.01, height: 58, width: '100%' },
}));
