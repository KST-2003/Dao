import { makeStyles } from '@/shared/theme';

export const useStyles = makeStyles(({ colors, spacing, radius }) => ({
  mapRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  mapRowError: { borderColor: colors.danger },
  mapRowText: { flex: 1 },
}));
