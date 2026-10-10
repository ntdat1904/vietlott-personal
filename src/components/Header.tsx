import { useTranslation } from 'react-i18next';
import { Database, RefreshCw, Sparkles } from 'lucide-react';
import { LanguageSwitcher } from './LanguageSwitcher';
import { ShareQr } from './ShareQr';
import { IconTooltip, ControlTooltip } from './InfoTooltip';

export function Header({ onRefresh, isRefreshing }: { onRefresh: () => void; isRefreshing: boolean }) {
  const { t } = useTranslation();

  return (
    <header className="bg-gradient-to-r from-[#e9002a] via-[#e1002d] to-[#cd001e]">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4">
        <div className="flex items-center gap-3">
          <IconTooltip label={t('header.logoTooltip')}>
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-sm font-extrabold text-rose-600">
              55
            </span>
          </IconTooltip>
          <div>
            <h1 className="flex items-center gap-1.5 text-lg font-extrabold leading-tight text-white sm:text-xl">
              {t('header.title')}
              <Sparkles size={18} className="text-amber-300" aria-hidden="true" />
            </h1>
            <p className="text-xs text-rose-100">{t('header.subtitle')}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <IconTooltip label={t('header.liveDataTooltip')}>
            <span className="hidden items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white sm:inline-flex">
              <Database size={14} aria-hidden="true" />
              {t('header.liveData')}
            </span>
          </IconTooltip>
          <ControlTooltip label={t('header.refreshTooltip')}>
            <button
              type="button"
              onClick={onRefresh}
              disabled={isRefreshing}
              aria-busy={isRefreshing}
              className="inline-flex min-w-[104px] items-center justify-center gap-1.5 rounded-lg border border-white/40 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} aria-hidden="true" />
              {isRefreshing ? t('header.refreshing') : t('header.refresh')}
            </button>
          </ControlTooltip>
          <ShareQr />
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
}
