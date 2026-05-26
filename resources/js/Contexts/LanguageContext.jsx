import { createContext, useContext, useEffect, useState } from 'react';
import { usePage } from '@inertiajs/react';

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
    const [lang, setLang] = useState(() => {
        return localStorage.getItem('wms_lang') || 'ar';
    });

    const dir = lang === 'ar' ? 'rtl' : 'ltr';

    // Apply to document whenever lang changes
    useEffect(() => {
        document.documentElement.lang = lang;
        document.documentElement.dir = dir;
        localStorage.setItem('wms_lang', lang);
        // Set cookie so backend middleware (HandleInertiaRequests) can read it
        document.cookie = `wms_locale=${lang};path=/;max-age=31536000;SameSite=Lax`;
    }, [lang, dir]);

    const changeLang = (newLang) => {
        setLang(newLang);
        // Set cookie synchronously so it is sent in the headers during router.reload()
        document.cookie = `wms_locale=${newLang};path=/;max-age=31536000;SameSite=Lax`;
        // We import and call router.reload to refresh translations and flash messages from backend
        import('@inertiajs/react').then(({ router }) => {
            router.reload();
        });
    };

    return (
        <LanguageContext.Provider value={{ lang, dir, setLang: changeLang }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLang() {
    const ctx = useContext(LanguageContext);
    if (!ctx) throw new Error('useLang must be used inside LanguageProvider');

    let translations = {};
    try {
        const page = usePage();
        if (page && page.props && page.props.translations) {
            translations = page.props.translations;
        }
    } catch (e) {
        // Fallback if called outside Inertia context
    }

    const __ = (key, replacements = {}) => {
        const parts = key.split('.');
        let translation = translations;
        for (const part of parts) {
            if (translation && translation[part] !== undefined) {
                translation = translation[part];
            } else {
                return key;
            }
        }
        if (typeof translation !== 'string') {
            return key;
        }
        Object.entries(replacements).forEach(([k, v]) => {
            translation = translation.replace(`:${k}`, v);
        });
        return translation;
    };

    return { ...ctx, __ };
}
