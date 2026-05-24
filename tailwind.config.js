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
                sans: ['var(--font-family)', 'IBM Plex Sans Arabic', 'Noto Sans Arabic', ...defaultTheme.fontFamily.sans],
            },
            colors: {
                primary: {
                    DEFAULT: 'var(--color-primary)',
                    hover: 'var(--color-primary-hover)',
                },
                success: 'var(--color-success)',
                warning: 'var(--color-warning)',
                danger: 'var(--color-danger)',
                info: 'var(--color-info)',
                background: 'var(--color-bg)',
                surface: {
                    DEFAULT: 'var(--color-surface)',
                    muted: 'var(--color-surface-muted)',
                },
                border: 'var(--color-border)',
                text: {
                    DEFAULT: 'var(--color-text)',
                    muted: 'var(--color-text-muted)',
                },
            },
            borderRadius: {
                DEFAULT: '0px',
                'none': '0px',
                'sm': '0px',
                'md': '0px',
                'lg': '0px',
                'xl': '0px',
                '2xl': '0px',
                '3xl': '0px',
                'full': '0px',
            },
        },
    },

    plugins: [forms],
};
