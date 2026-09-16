import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const ThemeContext = createContext({
    theme: 'dark',
    themeMode: 'dark',
    setThemeMode: () => {},
    toggleTheme: () => {},
});

export const ThemeProvider = ({ children }) => {
    // Read initial theme mode from localStorage, default to 'dark'
    const [themeMode, setThemeModeState] = useState(() => {
        try {
            const saved = localStorage.getItem('class_ledger_theme_mode');
            if (saved === 'light' || saved === 'dark' || saved === 'system') {
                return saved;
            }
        } catch {
            // Ignore localStorage errors
        }
        return 'dark';
    });

    // Determine effective theme ('dark' or 'light')
    const getSystemTheme = () => {
        if (typeof window !== 'undefined' && window.matchMedia) {
            return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
        return 'dark';
    };

    const [effectiveTheme, setEffectiveTheme] = useState(() => {
        return themeMode === 'system' ? getSystemTheme() : themeMode;
    });

    // Apply theme to document root
    const applyTheme = useCallback((theme) => {
        const root = document.documentElement;
        if (theme === 'dark') {
            root.classList.add('dark');
            root.classList.remove('light');
            root.style.colorScheme = 'dark';
        } else {
            root.classList.remove('dark');
            root.classList.add('light');
            root.style.colorScheme = 'light';
        }
    }, []);

    // Sync theme on mode change or system change
    useEffect(() => {
        const active = themeMode === 'system' ? getSystemTheme() : themeMode;
        setEffectiveTheme(active);
        applyTheme(active);

        try {
            localStorage.setItem('class_ledger_theme_mode', themeMode);
        } catch {
            // Ignore localStorage write error
        }

        if (themeMode === 'system' && typeof window !== 'undefined' && window.matchMedia) {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            const handleChange = (e) => {
                const newTheme = e.matches ? 'dark' : 'light';
                setEffectiveTheme(newTheme);
                applyTheme(newTheme);
            };

            mediaQuery.addEventListener('change', handleChange);
            return () => mediaQuery.removeEventListener('change', handleChange);
        }
    }, [themeMode, applyTheme]);

    const setThemeMode = (mode) => {
        if (mode === 'light' || mode === 'dark' || mode === 'system') {
            setThemeModeState(mode);
        }
    };

    const toggleTheme = () => {
        setThemeModeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
    };

    return (
        <ThemeContext.Provider
            value={{
                theme: effectiveTheme,
                themeMode,
                setThemeMode,
                toggleTheme,
            }}
        >
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};

export default ThemeContext;
