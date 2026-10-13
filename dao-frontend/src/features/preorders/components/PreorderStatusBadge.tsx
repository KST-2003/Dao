import { useTranslation } from 'react-i18next';
import { DAOBadge, type BadgeTone } from '@/shared/components';
import type { PreorderStatus } from '@/types/enums';

const TONES: Record<PreorderStatus, BadgeTone> = {
  submitted: 'neutral', in_review: 'gold', approved: 'sage', rejected: 'rose', waiting_payment: 'gold', in_process: 'sage',
  waiting_courier: 'sage', in_transit: 'sage', landed_myanmar: 'sage', packaging: 'sage', on_delivery: 'sage',
  completed: 'neutral', cancelled: 'rose', refunded: 'rose',
};

export function PreorderStatusBadge({ status }: { status: PreorderStatus }) {
  const { t } = useTranslation();
  return <DAOBadge label={t(`preorders.status.${status}`)} tone={TONES[status]} />;
}
