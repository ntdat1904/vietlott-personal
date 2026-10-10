import { Flame } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { StatsPayload } from '../lib/api';
import { NumberBall } from './NumberBall';
import { InfoTooltip, IconTooltip } from './InfoTooltip';

export function TopSixPanel({
  stats,
  onSelectNumber,
}: {
  stats: StatsPayload;
  onSelectNumber: (n: number) => void;
}) {
  const { t } = useTranslation();
  const top6 = stats.frequency.slice(0, 6);
  const maxCount = Math.max(1, ...top6.map((e) => e.count));

  return (
    <div className="panel flex flex-col p-5">
      <div className="mb-4 flex items-start gap-3">
        <IconTooltip label={t('top6.iconTooltip')}>
          <span className="section-icon">
            <Flame size={18} className="text-rose-500" aria-hidden="true" />
          </span>
        </IconTooltip>
        <div className="flex-1">
          <div className="flex items-center gap-1.5">
            <h2 className="panel-title">{t('top6.title')}</h2>
            <InfoTooltip label={t('top6.title')}>{t('top6.info')}</InfoTooltip>
          </div>
          <p className="panel-subtitle">{t('top6.subtitle', { count: stats.drawCount })}</p>
        </div>
      </div>

      <div className="mb-5 flex flex-wrap justify-center gap-2.5">
        {top6.map((entry) => (
          <NumberBall key={entry.n} n={entry.n} role="hot" size="lg" />
        ))}
      </div>

      <ul className="flex flex-col gap-2.5">
        {top6.map((entry, index) => {
          const percent = stats.drawCount > 0 ? Math.round((entry.count / stats.drawCount) * 100) : 0;
          return (
            <li key={entry.n}>
              <button
                type="button"
                data-testid="top6-rank"
                onClick={() => onSelectNumber(entry.n)}
                className="flex w-full items-center gap-3 rounded-lg px-1 py-0.5 text-left transition-colors hover:bg-slate-800/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
              >
                <span className="w-3 text-xs text-slate-500">{index + 1}</span>
                <NumberBall n={entry.n} role="filler" size="sm" />
                <span className="h-2 flex-1 overflow-hidden rounded-full bg-slate-800">
                  <span
                    className="block h-full rounded-full bg-gradient-to-r from-rose-400 to-red-600"
                    style={{ width: `${(entry.count / maxCount) * 100}%` }}
                  />
                </span>
                <span className="w-16 shrink-0 text-right text-xs text-slate-400">
                  <strong className="text-white">{entry.count}×</strong> {percent}%
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <p className="mt-4 text-xs leading-relaxed text-slate-500">{t('top6.tieNote')}</p>
    </div>
  );
}
