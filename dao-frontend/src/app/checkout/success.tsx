import { Redirect, useLocalSearchParams } from 'expo-router';

/** Stripe Checkout return URL (dao://checkout/success?order=ID). Payment is confirmed by webhook, not here. */
export default function CheckoutReturn() {
  const { order } = useLocalSearchParams<{ order?: string }>();
  return order ? <Redirect href={{ pathname: '/orders/[id]', params: { id: order } }} /> : <Redirect href="/(tabs)" />;
}
