import { CalendarDays, Diamond, Hash, Link2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Draw } from '../lib/frequency';
import { formatDate, formatMoneyShort, formatWeekday } from '../i18n/format';
import type { SupportedLanguage } from '../i18n';

interface StatCardsProps {
  drawCount: number;
  latestDraw: Draw | null;
}

function Card({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: string;
  hint: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="panel p-4">
      <div className="mb-1 flex items-start justify-between gap-2">
        <span className="text-xs text-slate-400">{label}</span>
        <span className="text-rose-500" aria-hidden="true">
          {icon}
        </span>
      </div>
      <p className="text-2xl font-extrabold text-white">{value}</p>
      <p className="mt-1 text-xs text-slate-400">{hint}</p>
    </div>
  );
}

export function StatCards({ drawCount, latestDraw }: StatCardsProps) {
  const { t, i18n } = useTranslation();
  const lang = (i18n.language?.startsWith('en') ? 'en' : 'vi') as SupportedLanguage;

  const latestDateLabel = latestDraw
    ? `${formatWeekday(latestDraw.date, lang)}, ${formatDate(latestDraw.date, lang)}`
    : '—';

  return (
    <section className="mx-auto grid max-w-7xl grid-cols-1 gap-4 px-4 pt-5 sm:grid-cols-2 lg:grid-cols-4">
      <Card
        label={t('stats.analyzedDraws')}
        value={String(drawCount)}
        hint={t('stats.lastThirtyDays')}
        icon={<Hash size={16} />}
      />
      <Card
        label={t('stats.latestDraw')}
        value={latestDraw ? `#${latestDraw.drawId}` : '—'}
        hint={latestDateLabel}
        icon={<CalendarDays size={16} />}
      />
      <Card
        label={t('stats.jackpot1')}
        value={latestDraw?.jackpot1Vnd ? formatMoneyShort(latestDraw.jackpot1Vnd, lang) : '—'}
        hint={t('stats.jackpot1Hint')}
        icon={<Diamond size={16} />}
      />
      <Card
        label={t('stats.jackpot2')}
        value={latestDraw?.jackpot2Vnd ? formatMoneyShort(latestDraw.jackpot2Vnd, lang) : '—'}
        hint={t('stats.jackpot2Hint')}
        icon={<Link2 size={16} />}
      />
    </section>
  );
}
