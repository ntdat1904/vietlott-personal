import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Header } from './components/Header';
import { StatCards } from './components/StatCards';
import { TopSixPanel } from './components/TopSixPanel';
import { FrequencyChart } from './components/FrequencyChart';
import { TierSuggestions } from './components/TierSuggestions/TierSuggestions';
import { ResultsTable } from './components/ResultsTable';
import { CommunityPicks } from './components/CommunityPicks';
import { PICKS_API_URL } from './lib/picksApi';
import { Disclaimer } from './components/Disclaimer';
import { Footer } from './components/Footer';
import { ErrorBanner, StaleBanner } from './components/Banners';
import { useLotteryData } from './hooks/useLotteryData';
import { STALE_DATA_DAYS } from './config/game';
import { buildRecommendations } from './lib/recommend';
import { dateIsoDaysAgo, todayIct } from './lib/dates';

export default function App() {
  const { t } = useTranslation();
  const { meta, draws, stats, recommendations, refreshedAt, isLoading, isError, isFetching, refetchAll } =
    useLotteryData();
  const [activeNumber, setActiveNumber] = useState<number | null>(null);

  const lastDrawDate = meta.data?.lastDrawDate ?? null;
  const isStale = Boolean(lastDrawDate && lastDrawDate < dateIsoDaysAgo(todayIct(), STALE_DATA_DAYS));
  const latestDraw = draws.data?.draws[0] ?? null;

  const toggleNumber = (n: number) => setActiveNumber((prev) => (prev === n ? null : n));

  // Re-forecast from the freshly fetched draws instead of trusting the stored
  // snapshot, so pressing Refresh updates the suggestions as soon as a new draw
  // lands -- without waiting for the next pipeline run. This is the same pure
  // function the pipeline uses, so both produce identical output for a given day.
  const today = todayIct();
  const forecast = useMemo(() => {
    if (!draws.data) return null;
    return { date: today, drawCount: draws.data.draws.length, tiers: buildRecommendations(draws.data.draws, today) };
  }, [draws.data, today]);

  const suggestions = forecast ?? recommendations.data ?? null;

  return (
    <div className="min-h-screen bg-slate-950">
      <Header onRefresh={refetchAll} isRefreshing={isFetching} />

      <div className="mx-auto max-w-7xl px-4">
        {isError && <ErrorBanner onRetry={refetchAll} />}
        {!isError && isStale && <StaleBanner />}
      </div>

      {isLoading && !stats.data && (
        <p className="mx-auto max-w-7xl px-4 pt-10 text-center text-slate-400">{t('state.loading')}</p>
      )}

      {stats.data && <StatCards drawCount={stats.data.drawCount} latestDraw={latestDraw} />}

      {suggestions && (
        <TierSuggestions
          tiers={suggestions.tiers}
          drawCount={suggestions.drawCount}
          date={suggestions.date}
        />
      )}

      {stats.data && (
        <section className="mx-auto grid max-w-7xl grid-cols-1 gap-4 px-4 pt-5 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
          <TopSixPanel stats={stats.data} onSelectNumber={toggleNumber} />
          <FrequencyChart stats={stats.data} activeNumber={activeNumber} onSelectNumber={toggleNumber} />
        </section>
      )}

      {PICKS_API_URL && <CommunityPicks />}

      {draws.data && (
        <ResultsTable
          draws={draws.data.draws}
          activeNumber={activeNumber}
          onClearActiveNumber={() => setActiveNumber(null)}
        />
      )}

      <Disclaimer />
      <Footer generatedAt={meta.data?.generatedAt ?? null} refreshedAt={refreshedAt} />
    </div>
  );
}
