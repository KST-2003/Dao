import { useEffect, useState } from 'react';
import { useAddresses } from '@/features/addresses/api';
import { useCart } from '@/features/cart/api';
import { useMembership } from '@/features/loyalty/api';
import { useAppConfig } from '@/features/auth/api';
import type { DeliveryMethod, PaymentMethod } from '@/types/enums';
import { useCheckoutOptions } from '../api';

/** Checkout selections (address, delivery, payment, promo, points). Defaults come from the server. */
export function useCheckoutForm() {
  const cart = useCart();
  const addresses = useAddresses();
  const membership = useMembership();
  const config = useAppConfig();
  const [addressId, setAddressId] = useState<number | null>(null);
  const [deliveryChoice, setDeliveryChoice] = useState<DeliveryMethod | null>(null);
  const [paymentChoice, setPaymentChoice] = useState<PaymentMethod | null>(null);
  const options = useCheckoutOptions(addressId);
  const [coupon, setCoupon] = useState<string | null>(null);
  const [couponInput, setCouponInput] = useState('');
  const [points, setPoints] = useState(0);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (addressId === null && addresses.data?.length) {
      setAddressId((addresses.data.find((a) => a.is_default) ?? addresses.data[0])!.id);
    }
  }, [addresses.data, addressId]);

  // The address's country decides the delivery methods and the currency decides the payment methods, so a past choice
  // that no longer applies quietly falls back to the first one on offer.
  const deliveryMethods = options.data?.delivery_methods ?? [];
  const delivery: DeliveryMethod = deliveryMethods.find((m) => m.code === deliveryChoice)?.code ?? deliveryMethods[0]?.code ?? 'standard';
  const paymentMethods = options.data?.payment_methods ?? [];
  const payment: PaymentMethod | null = paymentMethods.find((m) => m === paymentChoice) ?? paymentMethods[0] ?? null;

  useEffect(() => {
    if (cart.data) {
      setCoupon((c) => c ?? cart.data.coupon_code);
      setPoints((p) => p || cart.data.points_to_redeem);
    }
  }, [cart.data]);

  const unit = config.data?.loyalty.redeem_points_unit ?? 100;
  const balance = membership.data?.balance ?? 0;
  const maxPoints = Math.floor(balance / unit) * unit;

  return {
    cart, addresses, options, config,
    addressId, setAddressId, address: addresses.data?.find((a) => a.id === addressId) ?? null,
    delivery, setDelivery: setDeliveryChoice, deliveryMethods, payment, setPayment: setPaymentChoice,
    coupon, couponInput, setCouponInput, applyCoupon: () => setCoupon(couponInput.trim().toUpperCase() || null), clearCoupon: () => setCoupon(null),
    points, setPoints, unit, balance, maxPoints,
    notes, setNotes,
  };
}
