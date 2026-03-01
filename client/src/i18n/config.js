import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import ukTranslation from './locales/uk/translation.json';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      uk: {
        translation: ukTranslation
      }
    },
    lng: 'uk',
    fallbackLng: 'uk',
    interpolation: {
      escapeValue: false
    },
    react: {
      useSuspense: false
    }
  });

export default i18n;
