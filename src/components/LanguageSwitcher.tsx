import { Languages } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { setLanguage, type SupportedLanguage } from '../i18n';

export function LanguageSwitcher() {
  const { t, i18n } = useTranslation();
  const current = (i18n.language?.startsWith('en') ? 'en' : 'vi') as SupportedLanguage;

  return (
    <div className="flex items-center gap-1.5" aria-label={t('language.switcher')}>
      <Languages size={15} className="hidden text-white/70 sm:block" aria-hidden="true" />
      <div className="flex rounded-full bg-white/15 p-0.5 text-xs font-bold">
        {(['vi', 'en'] as SupportedLanguage[]).map((lang) => (
          <button
            key={lang}
            type="button"
            onClick={() => setLanguage(lang)}
            aria-pressed={current === lang}
            className={`rounded-full px-2.5 py-1 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white ${
              current === lang ? 'bg-white text-rose-600' : 'text-white/80 hover:text-white'
            }`}
          >
            {t(`language.${lang}`)}
          </button>
        ))}
      </div>
    </div>
  );
}
