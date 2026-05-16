import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.jsx',
    ],

    theme: {
        extend: {
            fontFamily: {
                sans: ['IBM Plex Sans Arabic', 'Noto Sans Arabic', ...defaultTheme.fontFamily.sans],
            },
            colors: {
                primary: {
                    DEFAULT: '#2563eb',
                    hover: '#1d4ed8',
                },
                success: '#16a34a',
                warning: '#d97706',
                danger: '#dc2626',
                info: '#0891b2',
                background: '#f6f7f9',
                surface: {
                    DEFAULT: '#ffffff',
                    muted: '#f1f4f8',
                },
                border: '#d9dee7',
                text: {
                    DEFAULT: '#1f2933',
                    muted: '#64748b',
                },
            },
            borderRadius: {
                'md': '6px',
                'lg': '8px',
            },
        },
    },

    plugins: [forms],
};
