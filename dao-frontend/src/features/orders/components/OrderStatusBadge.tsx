import { useTranslation } from 'react-i18next';
import { DAOBadge, type BadgeTone } from '@/shared/components';
import type { OrderStatus } from '@/types/enums';

const TONES: Record<OrderStatus, BadgeTone> = {
  pending_payment: 'gold', paid: 'sage', processing: 'sage', packing: 'sage', shipped: 'sage', delivered: 'neutral', cancelled: 'rose', refunded: 'rose',
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const { t } = useTranslation();
  return <DAOBadge label={t(`orders.status.${status}`)} tone={TONES[status]} />;
}
