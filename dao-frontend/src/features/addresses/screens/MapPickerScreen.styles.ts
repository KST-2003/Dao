import { makeStyles } from '@/shared/theme';
import { PIN_SIZE } from '../constants/map';

export const useStyles = makeStyles(({ colors, spacing, radius, shadows }) => ({
  root: { flex: 1, backgroundColor: colors.background },
  map: { flex: 1 },
  pinWrap: { ...({ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, alignItems: 'center', justifyContent: 'center' } as const) },
  /** Lifts the icon by half its height so the pin TIP (not its middle) marks the chosen point. */
  pin: { marginBottom: PIN_SIZE },
  top: { position: 'absolute', top: 0, left: 0, right: 0, paddingHorizontal: spacing.gutter, gap: spacing.sm },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  searchBar: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.surface, borderRadius: radius.pill, paddingHorizontal: spacing.lg, height: 44, ...shadows.soft },
  searchInput: { flex: 1, color: colors.text, paddingVertical: 0 },
  suggestions: { maxHeight: 240, backgroundColor: colors.surface, borderRadius: radius.lg, ...shadows.soft },
  suggestion: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, gap: 2, borderBottomWidth: 1, borderBottomColor: colors.divider },
  bottom: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: spacing.gutter, paddingTop: spacing.lg, gap: spacing.md, backgroundColor: colors.background, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, ...shadows.soft },
  addressCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.lg, minHeight: 64, borderWidth: 1, borderColor: colors.border },
  addressText: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xxl, gap: spacing.md },
}));
