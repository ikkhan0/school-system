import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

i18n
    .use(Backend) // Load translations from /public/locales
    .use(LanguageDetector) // Detect user language
    .use(initReactI18next) // Pass i18n instance to react-i18next
    .init({
        fallbackLng: 'en', // Default language
        debug: import.meta.env.DEV, // Enable debug in development
        supportedLngs: ['en', 'ur', 'ar', 'hi', 'bn', 'es', 'fr'], // Supported languages

        interpolation: {
            escapeValue: false, // React already safes from xss
        },

        backend: {
            loadPath: '/locales/{{lng}}/{{ns}}.json', // Translation file path
        },

        detection: {
            // Order of language detection methods
            order: ['localStorage', 'navigator', 'htmlTag'],
            caches: ['localStorage'], // Cache user's language selection
        },

        ns: ['common', 'dashboard', 'students', 'fees', 'attendance', 'exams', 'reports', 'sessions', 'staff', 'settings', 'communication'], // Namespaces
        defaultNS: 'common', // Default namespace

        react: {
            useSuspense: true, // Use Suspense for loading
        },
    });

export default i18n;
