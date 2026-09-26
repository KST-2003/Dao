/** Layout tokens extracted from the DAO UI references. */
export const spacing = {
  none: 0,
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
  /** Horizontal page gutter used on every screen. */
  gutter: 20,
} as const;

export const radius = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  xxl: 32,
  pill: 999,
} as const;

/** Image aspect ratios (width / height). */
export const ratios = {
  product: 3 / 4,
  productHero: 4 / 5,
  hero: 4 / 5,
  collection: 16 / 9,
  video: 9 / 16,
  videoCard: 3 / 4,
  recipe: 4 / 3,
  square: 1,
} as const;

export const shadows = {
  none: {},
  soft: {
    shadowColor: '#5C493F',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  card: {
    shadowColor: '#5C493F',
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  floating: {
    shadowColor: '#171917',
    shadowOpacity: 0.14,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
} as const;

export const motion = {
  fast: 150,
  base: 220,
  slow: 360,
  /** Gentle spring — no bouncy/childish overshoot. */
  spring: { damping: 18, stiffness: 180, mass: 0.9 },
} as const;

export const hitSlop = { top: 10, bottom: 10, left: 10, right: 10 } as const;
export const minTouchTarget = 44;
