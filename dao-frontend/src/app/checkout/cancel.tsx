import { Redirect, useLocalSearchParams } from 'expo-router';

export default function CheckoutCancel() {
  const { order } = useLocalSearchParams<{ order?: string }>();
  return order ? <Redirect href={{ pathname: '/orders/[id]', params: { id: order } }} /> : <Redirect href="/cart" />;
}
