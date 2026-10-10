import { useMemo, useState } from 'react';
import { ArrowDownUp, History, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Draw } from '../lib/frequency';
import { NumberBall } from './NumberBall';
import { formatDate, formatMoneyShort, formatWeekday } from '../i18n/format';
import type { SupportedLanguage } from '../i18n';
import { dateIsoDaysAgo, todayIct } from '../lib/dates';
import { IconTooltip, ControlTooltip } from './InfoTooltip';

type RangeDays = 7 | 14 | 30;
type MatchMode = 'any' | 'all';

export function ResultsTable({
  draws,
  activeNumber,
  onClearActiveNumber,
}: {
  draws: Draw[];
  activeNumber: number | null;
  onClearActiveNumber: () => void;
}) {
  const { t, i18n } = useTranslation();
  const lang = (i18n.language?.startsWith('en') ? 'en' : 'vi') as SupportedLanguage;

  const [rangeDays, setRangeDays] = useState<RangeDays>(30);
  const [newestFirst, setNewestFirst] = useState(true);
  const [search, setSearch] = useState('');
  const [matchMode, setMatchMode] = useState<MatchMode>('any');

  // Numbers typed into the filter box, e.g. "7 23" or "7, 23".
  const searchNumbers = useMemo(
    () =>
      search
        .split(/[^0-9]+/)
        .filter(Boolean)
        .map(Number)
        .filter((n) => n >= 1 && n <= 55),
    [search],
  );

  const rows = useMemo(() => {
    if (search.trim() && searchNumbers.length === 0) return [];

    const cutoff = dateIsoDaysAgo(todayIct(), rangeDays);
    let result = draws.filter((d) => d.date >= cutoff);

    if (activeNumber !== null) {
      result = result.filter((d) => d.numbers.includes(activeNumber) || d.bonus === activeNumber);
    }
    if (searchNumbers.length > 0) {
      result = result.filter((d) => {
        const inDraw = (n: number) => d.numbers.includes(n) || d.bonus === n;
        return matchMode === 'all' ? searchNumbers.every(inDraw) : searchNumbers.some(inDraw);
      });
    }
    return result.sort((a, b) => (newestFirst ? (a.date < b.date ? 1 : -1) : a.date > b.date ? 1 : -1));
  }, [draws, rangeDays, activeNumber, search, searchNumbers, matchMode, newestFirst]);

  return (
    <section className="mx-auto max-w-7xl px-4 pt-5">
      <div className="panel p-5">
        <div className="mb-4 flex items-start gap-3">
          <IconTooltip label={t('table.iconTooltip')}>
            <span className="section-icon">
              <History size={18} className="text-rose-500" aria-hidden="true" />
            </span>
          </IconTooltip>
          <div>
            <h2 className="panel-title">{t('table.title')}</h2>
            <p className="panel-subtitle">{t('table.showing', { shown: rows.length, total: draws.length })}</p>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-2">
          {([7, 14, 30] as RangeDays[]).map((days) => (
            <button
              key={days}
              type="button"
              onClick={() => setRangeDays(days)}
              aria-pressed={rangeDays === days}
              className={`chip ${rangeDays === days ? 'chip-on' : 'chip-off'}`}
            >
              {t('table.rangeDays', { count: days })}
            </button>
          ))}
          <ControlTooltip label={t('table.sortTooltip')}>
            <button
              type="button"
              onClick={() => setNewestFirst((v) => !v)}
              className="chip chip-off inline-flex items-center gap-1.5"
            >
              <ArrowDownUp size={13} aria-hidden="true" />
              {newestFirst ? t('table.newestFirst') : t('table.oldestFirst')}
            </button>
          </ControlTooltip>

          {activeNumber !== null && (
            <button type="button" onClick={onClearActiveNumber} className="chip chip-on">
              {t('table.filterContains')}: {String(activeNumber).padStart(2, '0')} ✕
            </button>
          )}

          <div className="ml-auto flex flex-wrap items-center gap-2">
            <label className="relative">
              <span className="sr-only">{t('table.search')}</span>
              <Search
                size={14}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                aria-hidden="true"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('table.searchPlaceholder')}
                className="w-56 rounded-lg border border-slate-700 bg-slate-800 py-1.5 pl-8 pr-3 text-xs text-slate-200 placeholder:text-slate-500 focus:border-rose-500 focus:outline-none"
              />
            </label>
            <div className="flex gap-1 rounded-lg bg-slate-800 p-0.5">
              {(['any', 'all'] as MatchMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setMatchMode(mode)}
                  aria-pressed={matchMode === mode}
                  className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
                    matchMode === mode ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {t(`table.match.${mode}`)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Desktop / tablet table */}
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] uppercase tracking-wide text-slate-500">
                <th scope="col" className="px-2 py-2 font-semibold">{t('table.drawId')}</th>
                <th scope="col" className="px-2 py-2 font-semibold">{t('table.date')}</th>
                <th scope="col" className="px-2 py-2 font-semibold">{t('table.numbers')}</th>
                <th scope="col" className="px-2 py-2 font-semibold">{t('table.bonus')}</th>
                <th scope="col" className="px-2 py-2 text-right font-semibold">{t('table.jackpot1')}</th>
                <th scope="col" className="px-2 py-2 text-right font-semibold">{t('table.jackpot2')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((draw) => (
                <tr key={draw.drawId} className="border-b border-slate-800/60">
                  <td className="whitespace-nowrap px-2 py-2.5 font-semibold text-white">#{draw.drawId}</td>
                  <td className="whitespace-nowrap px-2 py-2.5 text-slate-300">
                    {formatWeekday(draw.date, lang)}, {formatDate(draw.date, lang)}
                  </td>
                  <td className="px-2 py-2.5">
                    <div className="flex flex-wrap gap-1">
                      {draw.numbers.map((n) => (
                        <NumberBall key={n} n={n} role="filler" size="sm" />
                      ))}
                    </div>
                  </td>
                  <td className="px-2 py-2.5">
                    <NumberBall n={draw.bonus} role="bonus" size="sm" />
                  </td>
                  <td className="whitespace-nowrap px-2 py-2.5 text-right text-slate-300">
                    {draw.jackpot1Vnd ? formatMoneyShort(draw.jackpot1Vnd, lang) : '—'}
                  </td>
                  <td className="whitespace-nowrap px-2 py-2.5 text-right text-slate-300">
                    {draw.jackpot2Vnd ? formatMoneyShort(draw.jackpot2Vnd, lang) : '—'}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-2 py-8 text-center text-slate-500">
                    {t('table.empty')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile card list */}
        <div className="flex flex-col gap-3 md:hidden">
          {rows.map((draw) => (
            <div key={draw.drawId} className="rounded-lg border border-slate-800 bg-slate-800/40 p-3">
              <div className="mb-2 flex items-center justify-between text-xs">
                <span className="font-semibold text-white">#{draw.drawId}</span>
                <span className="text-slate-400">{formatDate(draw.date, lang)}</span>
              </div>
              <div className="flex flex-wrap items-center gap-1">
                {draw.numbers.map((n) => (
                  <NumberBall key={n} n={n} role="filler" size="sm" />
                ))}
                <span className="px-0.5 text-amber-400" aria-hidden="true">
                  +
                </span>
                <NumberBall n={draw.bonus} role="bonus" size="sm" />
              </div>
            </div>
          ))}
          {rows.length === 0 && <p className="py-6 text-center text-sm text-slate-500">{t('table.empty')}</p>}
        </div>
      </div>
    </section>
  );
}
