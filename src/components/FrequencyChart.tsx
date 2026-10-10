import { useState } from 'react';
import { BarChart3 } from 'lucide-react';
import {
  Bar,
  BarChart,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useTranslation } from 'react-i18next';
import type { StatsPayload } from '../lib/api';
import { InfoTooltip, IconTooltip } from './InfoTooltip';

type Dataset = 'main' | 'bonus';
type SortMode = 'natural' | 'frequency';

const COLORS = {
  top6: '#f4053c',
  other: '#64748b',
  active: '#10b981',
};

export function FrequencyChart({
  stats,
  activeNumber,
  onSelectNumber,
}: {
  stats: StatsPayload;
  activeNumber: number | null;
  onSelectNumber: (n: number) => void;
}) {
  const { t } = useTranslation();
  const [dataset, setDataset] = useState<Dataset>('main');
  const [sortMode, setSortMode] = useState<SortMode>('natural');

  const top6Set = new Set(stats.top6);
  const source =
    dataset === 'main'
      ? stats.frequency.map((e) => ({ n: e.n, count: e.count, lastSeen: e.lastSeen }))
      : stats.bonusFrequency.map((e) => ({ n: e.n, count: e.count, lastSeen: null as string | null }));

  const data = source
    .slice()
    .sort((a, b) => (sortMode === 'natural' ? a.n - b.n : b.count - a.count || a.n - b.n))
    .map((e) => ({ ...e, isTop6: dataset === 'main' && top6Set.has(e.n) }));

  // Expected average appearances per number over the window, shown as a guide line.
  const expectedAverage =
    dataset === 'main' ? (stats.drawCount * 6) / 55 : stats.drawCount / 55;

  return (
    <div className="panel flex flex-col p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <IconTooltip label={t('chart.iconTooltip')}>
            <span className="section-icon">
              <BarChart3 size={18} className="text-rose-500" aria-hidden="true" />
            </span>
          </IconTooltip>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="panel-title">{t('chart.frequencyTitle')}</h2>
              <InfoTooltip label={t('chart.frequencyTitle')}>{t('chart.frequencyInfo')}</InfoTooltip>
            </div>
            <p className="panel-subtitle min-h-[32px]">{t('chart.frequencySubtitle')}</p>
          </div>
        </div>

        <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:flex-row">
          <div className="flex gap-1 rounded-lg bg-slate-800 p-0.5">
            {(['main', 'bonus'] as Dataset[]).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setDataset(key)}
                aria-pressed={dataset === key}
                data-testid="chart-toggle"
                className={`min-w-[104px] flex-1 rounded-md px-2.5 py-1 text-center text-xs font-semibold transition-colors sm:flex-none ${
                  dataset === key ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {t(`chart.dataset.${key}`)}
              </button>
            ))}
          </div>
          <div className="flex gap-1 rounded-lg bg-slate-800 p-0.5">
            {(['natural', 'frequency'] as SortMode[]).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setSortMode(key)}
                aria-pressed={sortMode === key}
                data-testid="chart-toggle"
                className={`min-w-[104px] flex-1 rounded-md px-2.5 py-1 text-center text-xs font-semibold transition-colors sm:flex-none ${
                  sortMode === key ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {t(`chart.sort.${key}`)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="h-72 min-w-[720px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 8, right: 8, bottom: 4, left: -24 }}
              onClick={(e) => {
                const n = e?.activePayload?.[0]?.payload?.n;
                if (typeof n === 'number') onSelectNumber(n);
              }}
            >
              <XAxis
                dataKey="n"
                tick={{ fontSize: 10, fill: '#94a3b8' }}
                tickFormatter={(v: number) => String(v).padStart(2, '0')}
                interval={1}
                axisLine={{ stroke: '#1e293b' }}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 10, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
              />
              <ReferenceLine
                y={expectedAverage}
                stroke="#64748b"
                strokeDasharray="4 4"
                label={{ value: t('chart.expectedShort'), position: 'right', fill: '#94a3b8', fontSize: 10 }}
              />
              <Tooltip
                cursor={{ fill: 'rgba(148,163,184,0.18)' }}
                contentStyle={{
                  backgroundColor: '#0f172a',
                  border: '1px solid #1e293b',
                  borderRadius: 8,
                  fontSize: 12,
                  color: '#ffffff',
                }}
                // Without this, Recharts tints the hovered row with the bar's own
                // fill, which is unreadable for the grey "other numbers" bars.
                itemStyle={{ color: '#ffffff' }}
                labelStyle={{ color: '#ffffff' }}
                formatter={(value: number, _name, props) => [
                  t('chart.frequencyTooltip', {
                    n: String(props.payload.n).padStart(2, '0'),
                    count: value,
                    lastSeen: props.payload.lastSeen ?? '—',
                  }),
                  '',
                ]}
                labelFormatter={() => ''}
              />
              <Bar dataKey="count" radius={[2, 2, 0, 0]} maxBarSize={14}>
                {data.map((entry) => (
                  <Cell
                    key={entry.n}
                    fill={
                      activeNumber === entry.n ? COLORS.active : entry.isTop6 ? COLORS.top6 : COLORS.other
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-3 flex min-h-[20px] flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
        <LegendSwatch color={COLORS.top6} label={t('chart.legendTop6')} />
        <LegendSwatch color={COLORS.other} label={t('chart.legendOthers')} />
        <LegendSwatch color={COLORS.active} label={t('chart.legendActive')} />
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-0 w-5 border-t-2 border-dashed border-slate-500" aria-hidden="true" />
          {t('chart.legendExpected')}
        </span>
      </div>
    </div>
  );
}

function LegendSwatch({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} aria-hidden="true" />
      {label}
    </span>
  );
}
