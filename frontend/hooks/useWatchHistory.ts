import useSWR from 'swr'
import { getUserHistory } from '@/lib/api/profile'

export function useWatchHistory(userId: string) {
  const { data, error, mutate } = useSWR(
    userId ? ['watchHistory', userId] : null,
    ([_, id]) => getUserHistory(id),
    {
      revalidateOnFocus: false,
    }
  )

  return {
    history: data,
    isLoading: !error && !data,
    isError: error,
    mutate,
  }
}
