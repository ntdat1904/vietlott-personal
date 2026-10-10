import { Dices } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { TierSuggestion } from '../../lib/recommend';
import { TierCard } from './TierCard';
import { InfoTooltip, IconTooltip } from '../InfoTooltip';
import { SMALL_SAMPLE_THRESHOLD, TIERS } from '../../config/game';
import { formatDate, formatWeekday } from '../../i18n/format';
import type { SupportedLanguage } from '../../i18n';

export function TierSuggestions({
  tiers,
  drawCount,
  date,
}: {
  tiers: TierSuggestion[];
  drawCount: number;
  date: string;
}) {
  const { t, i18n } = useTranslation();
  const lang = (i18n.language?.startsWith('en') ? 'en' : 'vi') as SupportedLanguage;
  // Display order comes from the config, not from the stored JSON, so a snapshot
  // written before an ordering change still renders in the current order.
  const configOrder = new Map(TIERS.map((tier) => [tier.tierId, tier.order]));
  const ordered = [...tiers].sort(
    (a, b) => (configOrder.get(a.tierId) ?? a.order) - (configOrder.get(b.tierId) ?? b.order),
  );

  return (
    <section id="hero" className="mx-auto max-w-7xl px-4 pt-5">
      <div className="panel p-5">
        <div className="mb-4 flex items-start gap-3">
          <IconTooltip label={t('hero.iconTooltip')}>
            <span className="section-icon">
              <Dices size={18} className="text-rose-500" aria-hidden="true" />
            </span>
          </IconTooltip>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="panel-title">{t('hero.title')}</h2>
              <InfoTooltip label={t('hero.title')}>{t('hero.info')}</InfoTooltip>
            </div>
            <p className="panel-subtitle">
              {formatWeekday(date, lang)}, {formatDate(date, lang)} · {t('hero.orderNote')}
            </p>
          </div>
        </div>

        {drawCount < SMALL_SAMPLE_THRESHOLD && (
          <p className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
            {t('hero.smallSample', { count: drawCount })}
          </p>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {ordered.map((tier) => (
            <TierCard key={tier.tierId} suggestion={tier} />
          ))}
        </div>
      </div>
    </section>
  );
}
