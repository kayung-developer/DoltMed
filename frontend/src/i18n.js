import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files (in a real app, these would be large JSON files)
import en from './locales/en/translation.json'; // English
import fr from './locales/fr/translation.json'; // French
// ... import spanish, chinese, japan, korean, russian, italy, finnish

const resources = {
  en: { translation: en },
  fr: { translation: fr },
  // ... add others
};

i18n
  .use(LanguageDetector) // Detect user language
  .use(initReactI18next) // Pass i18n down to react-i18next
  .init({
    resources,
    fallbackLng: 'en', // Default
    supportedLngs: ['en', 'fr', 'es', 'zh', 'ja', 'ko', 'ru', 'it', 'fi'],
    interpolation: {
      escapeValue: false, // React already safes from XSS
    },
    detection: {
        order: ['localStorage', 'navigator'],
        caches: ['localStorage']
    }
  });

export default i18n;