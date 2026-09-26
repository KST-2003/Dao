import { makeStyles } from '@/shared/theme';

export const useStyles = makeStyles(({ spacing }) => ({
  hero: { alignItems: 'center', gap: spacing.md, marginTop: spacing.xxxl, marginBottom: spacing.xxxl },
  buttons: { gap: spacing.md },
  guest: { alignItems: 'center', marginTop: spacing.xl },
  terms: { marginTop: spacing.xxl, paddingHorizontal: spacing.lg },
  referral: { marginTop: spacing.lg, gap: spacing.sm },
}));
