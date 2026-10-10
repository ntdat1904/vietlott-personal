import { useState } from 'react';
import { Dices, Send, Users, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MAIN_NUMBERS_COUNT, POOL_MAX, POOL_MIN } from '../config/game';
import { getCommunityTop, submitPick } from '../lib/picksApi';
import { NumberBall } from './NumberBall';
import { InfoTooltip, IconTooltip } from './InfoTooltip';

const POOL = Array.from({ length: POOL_MAX - POOL_MIN + 1 }, (_, i) => POOL_MIN + i);

function quickPick(): number[] {
  const pool = [...POOL];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, MAIN_NUMBERS_COUNT);
}

export function CommunityPicks() {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<number[]>([]);

  const top = useQuery({
    queryKey: ['communityTop'],
    queryFn: getCommunityTop,
    refetchInterval: 60_000,
    retry: 1,
  });

  const submit = useMutation({
    mutationFn: submitPick,
    onSuccess: () => {
      setSelected([]);
      void queryClient.invalidateQueries({ queryKey: ['communityTop'] });
    },
  });

  const toggle = (n: number) => {
    submit.reset();
    setSelected((prev) =>
      prev.includes(n) ? prev.filter((x) => x !== n) : prev.length < MAIN_NUMBERS_COUNT ? [...prev, n] : prev,
    );
  };

  const full = selected.length === MAIN_NUMBERS_COUNT;
  const sortedSelection = [...selected].sort((a, b) => a - b);
  const data = top.data;
  const maxCount = Math.max(1, ...(data?.top6.map((e) => e.count) ?? []));
  const mine = data?.mine ?? null;
  const timeFmt = new Intl.DateTimeFormat(i18n.language?.startsWith('en') ? 'en-US' : 'vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
  });

  return (
    <section className="mx-auto max-w-7xl px-4 pt-5" data-testid="community-picks">
      <div className="panel p-5">
        <div className="mb-4 flex items-start gap-3">
          <IconTooltip label={t('community.iconTooltip')}>
            <span className="section-icon">
              <Users size={18} className="text-rose-500" aria-hidden="true" />
            </span>
          </IconTooltip>
          <div className="flex-1">
            <div className="flex items-center gap-1.5">
              <h2 className="panel-title">{t('community.title')}</h2>
              <InfoTooltip label={t('community.title')}>{t('community.info')}</InfoTooltip>
            </div>
            <p className="panel-subtitle">
              {data ? t('community.subtitle', { count: data.totalTickets }) : t('community.subtitleLoading')}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,360px)]">
          {/* Picker */}
          <div>
            <div className="mb-3 flex max-w-xl items-center justify-between gap-2">
              <span className="text-sm font-semibold text-white">{t('community.pickTitle')}</span>
              <span className="text-xs tabular-nums text-slate-400" aria-live="polite">
                {t('community.selected', { count: selected.length, max: MAIN_NUMBERS_COUNT })}
              </span>
            </div>

            <div className="grid max-w-xl grid-cols-8 gap-1.5 sm:grid-cols-11" role="group" aria-label={t('community.pickTitle')}>
              {POOL.map((n) => {
                const on = selected.includes(n);
                const disabled = !on && full;
                return (
                  <button
                    key={n}
                    type="button"
                    data-testid="pick-number"
                    aria-pressed={on}
                    disabled={disabled}
                    onClick={() => toggle(n)}
                    className={`aspect-square rounded-full text-xs font-bold tabular-nums transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 sm:text-sm ${
                      on
                        ? 'bg-gradient-to-br from-rose-500 to-red-600 text-white'
                        : disabled
                          ? 'bg-slate-800/50 text-slate-600'
                          : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                    }`}
                  >
                    {String(n).padStart(2, '0')}
                  </button>
                );
              })}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  submit.reset();
                  setSelected(quickPick());
                }}
                className="chip chip-off inline-flex items-center gap-1.5"
              >
                <Dices size={14} aria-hidden="true" />
                {t('community.quickPick')}
              </button>
              <button
                type="button"
                onClick={() => {
                  submit.reset();
                  setSelected([]);
                }}
                disabled={selected.length === 0}
                className="chip chip-off inline-flex items-center gap-1.5 disabled:opacity-50"
              >
                <X size={14} aria-hidden="true" />
                {t('community.clear')}
              </button>
              <button
                type="button"
                data-testid="submit-pick"
                onClick={() => submit.mutate(sortedSelection)}
                disabled={!full || submit.isPending}
                className="chip chip-on ml-auto inline-flex items-center gap-1.5 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Send size={14} aria-hidden="true" />
                {submit.isPending ? t('community.submitting') : mine ? t('community.replace') : t('community.submit')}
              </button>
            </div>

            {submit.isSuccess && <p className="mt-3 text-xs text-emerald-400">{t('community.submitted')}</p>}
            {submit.isError && (
              <p className="mt-3 text-xs text-rose-400">{t('community.submitError', { error: submit.error.message })}</p>
            )}

            {mine && (
              <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/50 p-3" data-testid="my-pick">
                <div className="mb-2 flex flex-wrap items-baseline justify-between gap-1">
                  <span className="text-xs font-semibold text-white">{t('community.yourTicket')}</span>
                  <span className="text-[11px] text-slate-500">
                    {t('community.submittedAt', { time: timeFmt.format(new Date(mine.submittedAt)) })}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {mine.numbers.map((n) => (
                    <NumberBall key={n} n={n} role="core" size="sm" />
                  ))}
                </div>
                <p className="mt-2 text-[11px] leading-relaxed text-slate-500">{t('community.replaceNote')}</p>
              </div>
            )}
          </div>

          {/* Community top 6 */}
          <div>
            <span className="mb-3 block text-sm font-semibold text-white">{t('community.topTitle')}</span>
            {top.isError && <p className="text-xs text-rose-400">{t('community.loadError')}</p>}
            {data && data.top6.length === 0 && <p className="text-xs text-slate-400">{t('community.empty')}</p>}
            {data && data.top6.length > 0 && (
              <>
                <div className="mb-4 flex flex-wrap justify-center gap-2">
                  {data.top6.map((e) => (
                    <NumberBall key={e.n} n={e.n} role="hot" size="md" />
                  ))}
                </div>
                <ul className="flex flex-col gap-2" data-testid="community-top6">
                  {data.top6.map((e, index) => {
                    const percent = data.totalTickets > 0 ? Math.round((e.count / data.totalTickets) * 100) : 0;
                    return (
                      <li key={e.n} className="flex items-center gap-3">
                        <span className="w-3 text-xs text-slate-500">{index + 1}</span>
                        <NumberBall n={e.n} role="filler" size="sm" />
                        <span className="h-2 flex-1 overflow-hidden rounded-full bg-slate-800">
                          <span
                            className="block h-full rounded-full bg-gradient-to-r from-rose-400 to-red-600"
                            style={{ width: `${(e.count / maxCount) * 100}%` }}
                          />
                        </span>
                        <span className="w-28 shrink-0 whitespace-nowrap text-right text-xs text-slate-400">
                          <strong className="text-white">{e.count}</strong> {t('community.votes', { count: e.count })} · {percent}%
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
            <p className="mt-4 text-xs leading-relaxed text-slate-500">{t('community.topNote')}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
