import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchWordOfTheDay, addWordOfTheDayToDeck } from '@/lib/api/daily';
import { useCardStore } from '@/store/useCardStore';

export function useWordOfTheDay() {
  return useQuery({
    queryKey: ['word-of-the-day'],
    queryFn: fetchWordOfTheDay,
    staleTime: 1000 * 60 * 10,
  });
}

export function useAddWordOfTheDay() {
  const queryClient = useQueryClient();
  const addCard = useCardStore((s) => s.addCard);

  return useMutation({
    mutationFn: (deckId: number) => addWordOfTheDayToDeck(deckId),
    onSuccess: (card) => {
      addCard(card);
      queryClient.invalidateQueries({ queryKey: ['word-of-the-day'] });
    },
  });
}
