import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/api/client';
import { qk } from '@/shared/constants/queryKeys';
import { analytics } from '@/shared/services/analytics/AnalyticsService';
import { useAuthStore } from '@/shared/store/authStore';
import type { Coupon, LoyaltyTransaction, MembershipSummary, Paginated, PointsMeta, Referral, Reward } from '@/types/models';

const useSignedIn = () => useAuthStore((s) => s.status) === 'authenticated';

export function useMembership() {
  const enabled = useSignedIn();
  return useQuery({ queryKey: qk.membership, queryFn: () => api.get<MembershipSummary>('/me/membership'), enabled });
}

export function usePoints() {
  const enabled = useSignedIn();
  return useInfiniteQuery({
    queryKey: qk.points,
    enabled,
    initialPageParam: 1,
    queryFn: ({ pageParam }) => api.getRaw<Paginated<LoyaltyTransaction, PointsMeta>>('/me/points', { params: { page: pageParam } }),
    getNextPageParam: (last) => (last.meta.current_page < last.meta.last_page ? last.meta.current_page + 1 : undefined),
  });
}

export function useRewards() {
  const enabled = useSignedIn();
  return useQuery({ queryKey: qk.rewards, queryFn: () => api.get<Reward[]>('/rewards'), enabled });
}

export function useCoupons() {
  const enabled = useSignedIn();
  return useQuery({ queryKey: qk.coupons, queryFn: () => api.get<Coupon[]>('/me/coupons'), enabled });
}

export function useReferral() {
  const enabled = useSignedIn();
  return useQuery({ queryKey: qk.referral, queryFn: () => api.get<Referral>('/me/referral'), enabled });
}

export function useRedeemReward() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (reward: Reward) => api.post<{ redemption_id: number; status: string; coupon: Coupon | null }>(`/rewards/${reward.id}/redeem`),
    onSuccess: (_d, reward) => {
      analytics.track('points_redeemed', { reward: reward.code, points: reward.points_cost });
      void qc.invalidateQueries({ queryKey: qk.points });
      void qc.invalidateQueries({ queryKey: qk.membership });
      void qc.invalidateQueries({ queryKey: qk.coupons });
      void qc.invalidateQueries({ queryKey: qk.rewards });
    },
  });
}
