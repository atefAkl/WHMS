import { createContext, useContext, useEffect, useState } from 'react';

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
    }, [lang, dir]);

    return (
        <LanguageContext.Provider value={{ lang, dir, setLang }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLang() {
    const ctx = useContext(LanguageContext);
    if (!ctx) throw new Error('useLang must be used inside LanguageProvider');
    return ctx;
}
