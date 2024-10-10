import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import Backend from 'i18next-http-backend';
//   import LanguageDetector from 'i18next-browser-languagedetector';

i18n
    .use(Backend)
    // .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        fallbackLng: 'en',
        ns: ['YOROI', 'DEFAULT'],
        defaultNS: 'DEFAULT',
        backend: {
            loadPath: '/{{ns}}/translations/{{lng}}.json',
        },
        // detection: {
        //     order: ['querystring', 'navigator'],
        //     lookupQuerystring: 'lang'
        // },
        interpolation: {
            escapeValue: false,
        },
        // debug: true
    });

export default i18n;