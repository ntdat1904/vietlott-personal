import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import en from './locales/en.json';
import vi from './locales/vi.json';

export const SUPPORTED_LANGUAGES = ['vi', 'en'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

// Priority order: ?lang= -> localStorage('app.lang') -> navigator language -> fallback 'vi'.
const detectionOrder = ['querystring', 'localStorage', 'navigator'];

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      vi: { translation: vi },
    },
    fallbackLng: 'vi',
    supportedLngs: SUPPORTED_LANGUAGES as unknown as string[],
    nonExplicitSupportedLngs: true,
    detection: {
      order: detectionOrder,
      lookupQuerystring: 'lang',
      lookupLocalStorage: 'app.lang',
      caches: ['localStorage'],
    },
    interpolation: { escapeValue: false },
  });

export function setLanguage(lang: SupportedLanguage): void {
  void i18n.changeLanguage(lang);
  try {
    localStorage.setItem('app.lang', lang);
  } catch {
    // ignore
  }
  document.documentElement.lang = lang;
  document.title = i18n.t('app.title');
  const url = new URL(window.location.href);
  url.searchParams.set('lang', lang);
  window.history.replaceState({}, '', url.toString());
}

i18n.on('languageChanged', (lng) => {
  document.documentElement.lang = lng;
  document.title = i18n.t('app.title');
});

export default i18n;
