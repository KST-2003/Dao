import * as Clipboard from 'expo-clipboard';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useErrorMessage } from '@/shared/hooks/useErrorMessage';
import { toast } from '@/shared/store/toastStore';
import type { Reward } from '@/types/models';
import { useCoupons, useMembership, useRedeemReward, useRewards } from '../api';

export function useRewardsScreen() {
  const { t } = useTranslation();
  const rewards = useRewards();
  const coupons = useCoupons();
  const membership = useMembership();
  const redeem = useRedeemReward();
  const message = useErrorMessage();
  const [tab, setTab] = useState<'rewards' | 'coupons'>('rewards');
  const [pending, setPending] = useState<Reward | null>(null);
  const balance = membership.data?.balance ?? 0;

  return {
    tab, setTab, rewards, coupons, balance,
    pending,
    ask: (r: Reward) => setPending(r),
    close: () => setPending(null),
    confirm: () =>
      pending &&
      redeem.mutate(pending, {
        onSuccess: () => {
          setPending(null);
          toast.gold(t('rewards.redeemed'));
          setTab('coupons');
        },
        onError: (e) => toast.error(message(e)),
      }),
    redeeming: redeem.isPending,
    copy: async (code: string) => {
      await Clipboard.setStringAsync(code);
      toast.show(code);
    },
  };
}
