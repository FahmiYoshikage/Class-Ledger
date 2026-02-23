/** @type {import('tailwindcss').Config} */
export default {
    content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
    theme: {
        extend: {
            colors: {
                apple: {
                    bg: '#f5f5f7',
                    card: '#ffffff',
                    blue: '#0071e3',
                    'blue-hover': '#0077ED',
                    text: '#1d1d1f',
                    'text-secondary': '#6e6e73',
                    'text-tertiary': '#86868b',
                    border: '#d2d2d7',
                    'border-light': '#e8e8ed',
                    green: '#34C759',
                    red: '#FF3B30',
                    orange: '#FF9500',
                    purple: '#AF52DE',
                    gray: '#8E8E93',
                },
            },
            fontFamily: {
                sans: [
                    'Inter',
                    '-apple-system',
                    'BlinkMacSystemFont',
                    'SF Pro Display',
                    'SF Pro Text',
                    'Helvetica Neue',
                    'Helvetica',
                    'Arial',
                    'sans-serif',
                ],
            },
            boxShadow: {
                'apple-sm': '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)',
                apple: '0 2px 8px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.06)',
                'apple-lg': '0 4px 12px rgba(0,0,0,0.06), 0 8px 32px rgba(0,0,0,0.08)',
                'apple-xl': '0 8px 24px rgba(0,0,0,0.08), 0 16px 48px rgba(0,0,0,0.1)',
            },
            borderRadius: {
                apple: '12px',
                'apple-lg': '16px',
                'apple-xl': '20px',
            },
            animation: {
                'fade-in': 'fadeIn 0.3s ease-out',
                'slide-up': 'slideUp 0.4s ease-out',
                'scale-in': 'scaleIn 0.2s ease-out',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { opacity: '0', transform: 'translateY(12px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                scaleIn: {
                    '0%': { opacity: '0', transform: 'scale(0.95)' },
                    '100%': { opacity: '1', transform: 'scale(1)' },
                },
            },
        },
    },
    plugins: [],
};
