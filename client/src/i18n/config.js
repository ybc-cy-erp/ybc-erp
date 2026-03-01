import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

i18n
  .use(initReactI18next)
  .init({
    resources: {},
    lng: 'uk', // Ukrainian only
    fallbackLng: 'uk',
    interpolation: {
      escapeValue: false
    },
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json'
    }
  });

// Load Ukrainian translations
fetch('/locales/uk/translation.json')
  .then(res => res.json())
  .then(data => {
    i18n.addResourceBundle('uk', 'translation', data);
  });

export default i18n;
