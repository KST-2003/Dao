# DAO design system

Extracted from the DAO UI references and the brand logo (DAO wordmark + lily + champagne-gold star).

## Palette
| Token | Hex | Use |
|---|---|---|
| DAO Sage | #9EAD91 | brand, accents, selected states |
| Deep Sage | #66745E | filled buttons (AA contrast with white) |
| Ivory | #FFF9F1 | Botanical background |
| Soft Cream / Pearl | #F4EBDD / #F5EFE6 | muted surfaces, inputs, chips |
| Cocoa | #5C493F | text |
| Lily Rose / Dusty Rose | #D9A5A5 / #C99598 | favorites, sale, accents |
| Champagne Gold | #C9A96E | **only** DAO star, VIP, points, premium highlights |
| Midnight | #171917 | DAO Midnight background, premium tiers |

Semantic tokens (`background, surface, surfaceMuted, text, textMuted, primary, onPrimary, primarySoft, accent, gold, border, danger…`) are defined once per theme in `dao-frontend/src/shared/theme/themes.ts` and in `dao-admin/src/index.css`. Components never hardcode colors (ESLint rule). Content drawn over photos uses `media.*` tokens.

**Themes**: DAO Botanical (default) · DAO Midnight (dark / VIP / premium). User setting: Automatic / Botanical / Midnight.

## Typography
- Display & wordmark: **Cormorant Garamond** (editorial serif) — titles, section headers, prices on detail.
- UI text: **DM Sans**.
- Thai: **Noto Sans Thai**; Burmese: **Noto Sans Myanmar** (+40% line height). Fonts switch automatically with the app language.
- Variants: brand, display 34, title 26, heading 21, subheading 16, body 15, bodySmall 13, caption 12, overline 11 (tracked caps, EN only), price, button.

## Layout tokens
Spacing 2/4/8/12/16/20/24/32/48, page gutter 20. Radius 6/10/14/18/24/32/pill. Shadows soft/card/floating (cocoa-tinted, low opacity). Ratios: product 3:4, product hero 4:5, home hero 4:5, collection 16:9, video 9:16 (cards 3:4), recipe 4:3. Touch targets ≥44pt.

## Components (mobile)
DAOButton / DAOSecondaryButton, DAOIconButton, DAOCard, DAOProductCard, DAOProductGrid, DAOPrice, DAOBadge, DAOBottomSheet, DAOModal, DAOInput, DAOSelect, DAOTabBar, DAOHeader, DAOAvatar, DAOStar, DAOLilyMark, DAOLogo, DAOMemberBadge, DAOPointCard, DAOVideoCard, DAOCollectionCard, DAORecipeCard, DAOEmptyState, DAOErrorState, DAOLoadingSkeleton, DAOScreen, DAOChip, DAOSectionHeader, DAOQuantityStepper, DAOListItem, DAOHeartButton, DAOToastHost, DAOCelebration, AsyncState, OfflineBanner.

## Components (admin)
DAODataTable, DAOAdminCard, DAOAdminHeader, DAOSidebar, DAOStatsCard, DAOImageUploader, DAOVideoUploader, DAOStatusBadge, DAOConfirmDialog, TranslationTabs (EN/TH/MY editor), ResourcePage (config-driven form = DAOForm), Button, Field/Input/Select/Textarea/Toggle.

## Motion
Subtle only: heart scales 1→1.16→1 with a damped spring; add-to-bag = haptic + toast with "View bag"; points earned = gold star; tier upgrade = DAO star zoom + twinkle; skeletons pulse; screen transitions fade/slide. No bouncy overshoot.

## Brand assets
`dao-frontend/assets/brand/dao-logo-full.png` (supplied logo), `dao-mark.png` (lily + DAO + star). App icon/adaptive icon/splash were generated from the mark on the ivory logo background — no long text in the icon.
