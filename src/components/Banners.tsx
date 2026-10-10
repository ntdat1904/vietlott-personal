import { useTranslation } from 'react-i18next';
import { AlertTriangle, RotateCw } from 'lucide-react';

export function StaleBanner() {
  const { t } = useTranslation();
  return (
    <div className="mt-4 flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-sm text-amber-300">
      <AlertTriangle size={16} aria-hidden="true" />
      <span>{t('banner.stale')}</span>
    </div>
  );
}

export function ErrorBanner({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-sm text-rose-300">
      <span>{t('banner.error')}</span>
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex items-center gap-1.5 rounded-md bg-rose-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-rose-500"
      >
        <RotateCw size={13} aria-hidden="true" />
        {t('banner.retry')}
      </button>
    </div>
  );
}
