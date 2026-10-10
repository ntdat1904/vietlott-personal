import { useCallback, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getDraws, getMeta, getRecommendations, getStats, readCache, writeCache } from '../lib/api';
import type { DrawsFile, Meta, RecommendationsPayload, StatsPayload } from '../lib/api';

const STALE_TIME = 10 * 60 * 1000; // 10 minutes
const RETRIES = 2;

function useCachedQuery<T>(key: string, fetcher: (bust?: number) => Promise<T>, bustRef: { current?: number }) {
  return useQuery({
    queryKey: [key],
    queryFn: async () => {
      try {
        const data = await fetcher(bustRef.current);
        writeCache(key, data);
        return data;
      } catch (err) {
        const cached = readCache<T>(key);
        if (cached) return cached;
        throw err;
      }
    },
    staleTime: STALE_TIME,
    retry: RETRIES,
  });
}

export function useLotteryData() {
  // Set just before a manual refresh so the next request skips every cache layer.
  const bustRef = useRef<number | undefined>(undefined);
  const [refreshedAt, setRefreshedAt] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const meta = useCachedQuery<Meta>('meta', getMeta, bustRef);
  const draws = useCachedQuery<DrawsFile>('draws', getDraws, bustRef);
  const stats = useCachedQuery<StatsPayload>('stats', getStats, bustRef);
  const recommendations = useCachedQuery<RecommendationsPayload>('recommendations', getRecommendations, bustRef);

  const refetchAll = useCallback(async () => {
    bustRef.current = Date.now();
    setIsRefreshing(true);
    try {
      const results = await Promise.all([
        meta.refetch(),
        draws.refetch(),
        stats.refetch(),
        recommendations.refetch(),
      ]);
      // Only stamp the footer when the data really came back.
      if (results.every((r) => !r.isError)) {
        setRefreshedAt(new Date().toISOString());
      }
    } finally {
      setIsRefreshing(false);
    }
  }, [meta, draws, stats, recommendations]);

  return {
    meta,
    draws,
    stats,
    recommendations,
    refreshedAt,
    isLoading: meta.isLoading || draws.isLoading || stats.isLoading || recommendations.isLoading,
    isError: meta.isError || draws.isError || stats.isError || recommendations.isError,
    isFetching:
      isRefreshing || meta.isFetching || draws.isFetching || stats.isFetching || recommendations.isFetching,
    refetchAll,
  };
}
