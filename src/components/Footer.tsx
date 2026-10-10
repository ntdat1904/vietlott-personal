import { useTranslation } from 'react-i18next';
import type { SupportedLanguage } from '../i18n';

function formatStamp(iso: string, lang: SupportedLanguage): string {
  return new Date(iso).toLocaleString(lang === 'en' ? 'en-GB' : 'vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export function Footer({
  generatedAt,
  refreshedAt,
}: {
  generatedAt: string | null;
  refreshedAt: string | null;
}) {
  const { t, i18n } = useTranslation();
  const lang = (i18n.language?.startsWith('en') ? 'en' : 'vi') as SupportedLanguage;
  const updatedAt = refreshedAt ?? generatedAt;

  return (
    <footer className="mx-auto max-w-7xl px-4 py-6">
      <div className="flex flex-col items-center gap-1 text-center text-xs text-slate-500">
        <p>{t('footer.dataSource')}</p>
        {updatedAt && (
          <p data-testid="footer-generated-at">
            {t('header.lastUpdated', { time: formatStamp(updatedAt, lang) })}
          </p>
        )}
        <p>{t('footer.responsibleGaming')}</p>
      </div>
    </footer>
  );
}
