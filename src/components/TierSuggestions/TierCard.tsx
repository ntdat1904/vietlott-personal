import { Award, Crown, Gem, Medal, Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { TierSuggestion } from '../../lib/recommend';
import { tierHeaderColors, TIERS, type TierId } from '../../config/game';
import { NumberBall } from '../NumberBall';
import { InfoTooltip, IconTooltip } from '../InfoTooltip';
import { formatMoney, formatMoneyShort } from '../../i18n/format';
import type { SupportedLanguage } from '../../i18n';

const ICON_BY_TIER: Record<TierId, typeof Star> = {
  third: Star,
  second: Award,
  first: Medal,
  jackpot2: Gem,
  jackpot1: Crown,
};

export function TierCard({ suggestion }: { suggestion: TierSuggestion }) {
  const { t, i18n } = useTranslation();
  const lang = (i18n.language?.startsWith('en') ? 'en' : 'vi') as SupportedLanguage;
  const colors = tierHeaderColors[suggestion.tierId];
  const Icon = ICON_BY_TIER[suggestion.tierId];
  const config = TIERS.find((tier) => tier.tierId === suggestion.tierId)!;

  const prizeLabel =
    config.indicativeValueVnd !== null
      ? formatMoney(config.indicativeValueVnd, lang)
      : t('tier.fromAmount', { amount: formatMoneyShort(config.minJackpotVnd ?? 0, lang) });

  return (
    <div
      data-testid="tier-card"
      className="flex flex-col overflow-hidden rounded-xl border border-slate-800 bg-slate-900"
    >
      <div
        className={`flex items-center justify-between gap-2 bg-gradient-to-r px-3 py-2.5 ${colors.gradient} ${colors.text}`}
      >
        <span className="flex min-w-0 items-center gap-1.5">
          <IconTooltip label={t(`tier.${suggestion.tierId}.name`)}>
            <Icon size={16} className="shrink-0" aria-hidden="true" />
          </IconTooltip>
          <span className="truncate text-sm font-bold">
            {t(`tier.${suggestion.tierId}.name`)} · {t(`tier.${suggestion.tierId}.short`)}
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-1">
          <IconTooltip label={t('tier.badgeTooltip', { badge: config.badge, order: config.order })}>
            <span className="rounded bg-black/20 px-1.5 py-0.5 text-[10px] font-bold">{config.badge}</span>
          </IconTooltip>
          <InfoTooltip label={t('aria.aboutTier', { tier: t(`tier.${suggestion.tierId}.name`) })}>
            {t(`tier.${suggestion.tierId}.tooltip`)}
          </InfoTooltip>
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-3">
        <div className="flex flex-wrap gap-1.5">
          {suggestion.numbers.map((n) => (
            <NumberBall key={n} n={n} role={suggestion.core.includes(n) ? 'core' : 'filler'} size="sm" />
          ))}
        </div>

        {suggestion.bonusPick !== undefined && (
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-bold text-amber-400" aria-hidden="true">
              +
            </span>
            <NumberBall n={suggestion.bonusPick} role="bonus" size="sm" />
          </div>
        )}

        <dl className="flex flex-col gap-1 text-xs">
          <Row label={t('tier.conditionLabel')} value={t(`tier.${suggestion.tierId}.rule`)} />
          <Row label={t('tier.prizeLabel')} value={prizeLabel} strong />
          <Row label={t('tier.oddsLabel')} value={config.odds} />
        </dl>

        <p className="mt-auto border-t border-slate-800 pt-2.5 text-xs leading-relaxed text-slate-400">
          {t(`tier.${suggestion.tierId}.strategy`)}
        </p>
      </div>
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex gap-2">
      <dt className="w-20 shrink-0 text-slate-500">{label}</dt>
      <dd className={strong ? 'font-semibold text-white' : 'text-slate-200'}>{value}</dd>
    </div>
  );
}
