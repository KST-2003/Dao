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
  const options = useCheckoutOptions();
  const membership = useMembership();
  const config = useAppConfig();
  const [addressId, setAddressId] = useState<number | null>(null);
  const [delivery, setDelivery] = useState<DeliveryMethod>('standard');
  const [payment, setPayment] = useState<PaymentMethod | null>(null);
  const [coupon, setCoupon] = useState<string | null>(null);
  const [couponInput, setCouponInput] = useState('');
  const [points, setPoints] = useState(0);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (addressId === null && addresses.data?.length) {
      setAddressId((addresses.data.find((a) => a.is_default) ?? addresses.data[0])!.id);
    }
  }, [addresses.data, addressId]);

  useEffect(() => {
    if (payment === null && options.data?.payment_methods.length) {
      setPayment(options.data.payment_methods[0]!);
    }
  }, [options.data, payment]);

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
    delivery, setDelivery, payment, setPayment,
    coupon, couponInput, setCouponInput, applyCoupon: () => setCoupon(couponInput.trim().toUpperCase() || null), clearCoupon: () => setCoupon(null),
    points, setPoints, unit, balance, maxPoints,
    notes, setNotes,
  };
}
