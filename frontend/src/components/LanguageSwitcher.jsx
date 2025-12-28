import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

const LanguageSwitcher = () => {
    const { i18n, t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const [currentLanguage, setCurrentLanguage] = useState(i18n.language || 'en');

    // Only show languages with complete translation files
    const languages = [
        { code: 'en', name: 'English', nativeName: 'English', dir: 'ltr' },
        { code: 'ur', name: 'Urdu', nativeName: 'اردو', dir: 'rtl' },
        { code: 'ar', name: 'Arabic', nativeName: 'العربية', dir: 'rtl' },
        // TODO: Add more languages when translation files are ready
        // { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', dir: 'ltr' },
        // { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', dir: 'ltr' },
        // { code: 'es', name: 'Spanish', nativeName: 'Español', dir: 'ltr' },
        // { code: 'fr', name: 'French', nativeName: 'Français', dir: 'ltr' },
    ];

    const changeLanguage = (langCode) => {
        i18n.changeLanguage(langCode);
        setCurrentLanguage(langCode);

        // Update HTML dir attribute for RTL support
        const selectedLang = languages.find(lang => lang.code === langCode);
        document.documentElement.dir = selectedLang?.dir || 'ltr';
        document.documentElement.lang = langCode;

        // Save to localStorage
        localStorage.setItem('preferredLanguage', langCode);

        setIsOpen(false);
    };

    useEffect(() => {
        // Set initial direction based on current language
        const currentLang = languages.find(lang => lang.code === i18n.language);
        document.documentElement.dir = currentLang?.dir || 'ltr';
        document.documentElement.lang = i18n.language;
    }, []);

    const currentLangData = languages.find(lang => lang.code === currentLanguage);

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                aria-label={t('language.selectLanguage')}
            >
                <Globe className="w-5 h-5" />
                <span className="hidden sm:inline text-sm font-medium">
                    {currentLangData?.nativeName || 'English'}
                </span>
            </button>

            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Dropdown Menu */}
                    <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50">
                        <div className="p-2">
                            <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                                {t('language.selectLanguage')}
                            </div>

                            {languages.map((lang) => (
                                <button
                                    key={lang.code}
                                    onClick={() => changeLanguage(lang.code)}
                                    className={`
                    w-full flex items-center justify-between px-3 py-2 rounded-md
                    hover:bg-gray-100 dark:hover:bg-gray-800 transition
                    ${currentLanguage === lang.code ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}
                  `}
                                >
                                    <span className="flex items-center gap-2">
                                        <span className="text-sm">{lang.nativeName}</span>
                                        <span className="text-xs text-gray-500">({lang.name})</span>
                                    </span>

                                    {currentLanguage === lang.code && (
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    )}
                                </button>
                            ))}
                        </div>

                        <div className="border-t border-gray-200 dark:border-gray-700 p-3">
                            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                                {languages.length} {t('language.selectLanguage').toLowerCase()}
                            </p>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default LanguageSwitcher;
