import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext(null);

const themes = {
    blue: { primary: '#2563eb', hover: '#1d4ed8' },
    emerald: { primary: '#059669', hover: '#047857' },
    amber: { primary: '#d97706', hover: '#b45309' },
    rose: { primary: '#e11d48', hover: '#be123c' },
    slate: { primary: '#475569', hover: '#334155' },
};

const backgrounds = {
    'flat-light': {
        bg: '#f6f7f9',
        surface: '#ffffff',
        muted: '#f1f4f8',
        text: '#1f2933',
        textMuted: '#64748b',
        border: '#d9dee7',
    },
    'warm-cream': {
        bg: '#f5f2eb',
        surface: '#fcfaf7',
        muted: '#eae6dc',
        text: '#2c251a',
        textMuted: '#7a6e5b',
        border: '#dfd7c9',
    },
    'flat-dark': {
        bg: '#0f172a',
        surface: '#1e293b',
        muted: '#334155',
        text: '#f8fafc',
        textMuted: '#94a3b8',
        border: '#334155',
    },
    'deep-blue': {
        bg: '#070d19',
        surface: '#0f1a30',
        muted: '#172847',
        text: '#f1f5f9',
        textMuted: '#8ba3c7',
        border: '#1e293b',
    },
};

const fonts = {
    cairo: "'Cairo', sans-serif",
    tajawal: "'Tajawal', sans-serif",
    alexandria: "'Alexandria', sans-serif",
    readex: "'Readex Pro', sans-serif",
    ibm: "'IBM Plex Sans Arabic', sans-serif",
};

export function ThemeProvider({ children }) {
    const [theme, setTheme] = useState(() => localStorage.getItem('wms_theme') || 'blue');
    const [bg, setBg] = useState(() => localStorage.getItem('wms_bg') || 'flat-light');
    const [font, setFont] = useState(() => localStorage.getItem('wms_font') || 'ibm');

    useEffect(() => {
        const root = document.documentElement;

        // Apply Theme Colors
        const themeColors = themes[theme] || themes.blue;
        root.style.setProperty('--color-primary', themeColors.primary);
        root.style.setProperty('--color-primary-hover', themeColors.hover);
        localStorage.setItem('wms_theme', theme);

        // Apply Background Styles
        const bgStyles = backgrounds[bg] || backgrounds['flat-light'];
        root.style.setProperty('--color-bg', bgStyles.bg);
        root.style.setProperty('--color-surface', bgStyles.surface);
        root.style.setProperty('--color-surface-muted', bgStyles.muted);
        root.style.setProperty('--color-text', bgStyles.text);
        root.style.setProperty('--color-text-muted', bgStyles.textMuted);
        root.style.setProperty('--color-border', bgStyles.border);
        localStorage.setItem('wms_bg', bg);

        // Apply dark mode class for tailwind or custom rules
        if (bg === 'flat-dark' || bg === 'deep-blue') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }

        // Apply Font Family
        const fontFamily = fonts[font] || fonts.ibm;
        root.style.setProperty('--font-family', fontFamily);
        localStorage.setItem('wms_font', font);
    }, [theme, bg, font]);

    return (
        <ThemeContext.Provider value={{ theme, setTheme, bg, setBg, font, setFont, themes, backgrounds, fonts }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const ctx = useContext(ThemeContext);
    if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
    return ctx;
}
