/** Mirrors app/Enums/*.php in dao-backend. Keep in sync. */
export type AuthProvider = 'google' | 'line' | 'sms';
export type Gender = 'female' | 'male' | 'other' | 'prefer_not_to_say';
export type ProductBadge = 'new' | 'bestseller' | 'dao_pick' | 'limited' | 'vip' | 'sale';
export type OrderStatus =
  | 'pending_payment'
  | 'paid'
  | 'processing'
  | 'packing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';
export type PaymentStatus = 'pending' | 'requires_action' | 'succeeded' | 'failed' | 'cancelled' | 'refunded';
export type PaymentMethod = 'cod' | 'bank_transfer' | 'stripe';
export type DeliveryMethod = 'standard' | 'express';
export type ShipmentStatus = 'pending' | 'in_transit' | 'delivered' | 'returned';
export type LoyaltyTransactionType =
  | 'purchase_earned'
  | 'signup_bonus'
  | 'review_bonus'
  | 'birthday_bonus'
  | 'referral_bonus'
  | 'campaign_bonus'
  | 'manual_adjustment'
  | 'redeemed'
  | 'redemption_reversal'
  | 'expired'
  | 'refund_reversal';
export type ContentType = 'vlog' | 'recipe' | 'fashion' | 'tutorial' | 'short';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type CouponType = 'percentage' | 'fixed' | 'free_shipping';
export type RewardType = 'discount_coupon' | 'free_shipping' | 'gift';
export type SaveableType = 'product' | 'video' | 'recipe';
export type NotificationType =
  | 'order_update'
  | 'new_drop'
  | 'member_reward'
  | 'points_earned'
  | 'points_expiring'
  | 'tier_upgrade'
  | 'new_vlog'
  | 'new_recipe'
  | 'promotion'
  | 'vip_event';
export type CartIssueCode = 'unavailable' | 'out_of_stock' | 'insufficient_stock' | 'price_changed';
export type ProductSort = 'newest' | 'price_asc' | 'price_desc' | 'popular' | 'rating';
export type PaymentAction = 'none' | 'redirect' | 'bank_transfer' | 'collect_on_delivery';
