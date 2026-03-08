import { useQuery } from '@tanstack/react-query';
import { fetchDailyMix } from '@/lib/api/daily';

export function useDailyMix() {
  return useQuery({
    queryKey: ['daily-mix'],
    queryFn: fetchDailyMix,
    staleTime: 1000 * 60 * 5,
  });
}
