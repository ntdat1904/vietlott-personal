import { Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { IconTooltip } from './InfoTooltip';

/** The permanent disclaimer bar shown at the bottom of the page (§7.7). */
export function Disclaimer() {
  const { t } = useTranslation();
  return (
    <section className="mx-auto max-w-7xl px-4 pt-5">
      <div className="panel flex items-start gap-3 p-4">
        <IconTooltip label={t('disclaimer_icon')}>
          <Info size={16} className="mt-0.5 shrink-0 text-slate-500" aria-hidden="true" />
        </IconTooltip>
        <p className="text-xs leading-relaxed text-slate-400">{t('disclaimer')}</p>
      </div>
    </section>
  );
}
