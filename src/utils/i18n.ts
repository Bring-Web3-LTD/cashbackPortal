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
        ns: ['DEFAULT'],
        defaultNS: 'DEFAULT',
        // Fallback chain — missing keys are looked up in order. Mobile
        // namespaces fall through to DEFAULT_MOBILE first, then DEFAULT.
        // Desktop namespaces only need DEFAULT; the extra hop is a no-op
        // when DEFAULT_MOBILE was never loaded.
        fallbackNS: ['DEFAULT_MOBILE', 'DEFAULT'],
        partialBundledLanguages: true,
        backend: {
            // Mobile namespaces (suffix `_MOBILE`) live under the platform's
            // `mobile/translations` subfolder; everything else uses the
            // existing desktop layout.
            loadPath: (_lngs: readonly string[], namespaces: readonly string[]) => {
                const ns = namespaces[0]
                if (ns.endsWith('_MOBILE')) {
                    const platform = ns.slice(0, -'_MOBILE'.length)
                    return `/${platform}/mobile/translations/{{lng}}.json`
                }
                return `/{{ns}}/translations/{{lng}}.json`
            },
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