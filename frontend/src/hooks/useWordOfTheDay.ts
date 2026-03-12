import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchWordOfTheDay, addWordOfTheDayToDeck } from '@/lib/api/daily';
import { CARDS_KEY } from './useCardsQuery';

export function useWordOfTheDay() {
  return useQuery({
    queryKey: ['word-of-the-day'],
    queryFn: fetchWordOfTheDay,
    staleTime: 1000 * 60 * 10,
  });
}

export function useAddWordOfTheDay() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (deckId: number) => addWordOfTheDayToDeck(deckId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CARDS_KEY });
      queryClient.invalidateQueries({ queryKey: ['word-of-the-day'] });
    },
  });
}
