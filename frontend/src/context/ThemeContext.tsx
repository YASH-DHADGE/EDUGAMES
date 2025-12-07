import React, { createContext, useState, useEffect, useContext } from 'react';
import { useColorScheme } from 'react-native';
import { Provider as PaperProvider } from 'react-native-paper';
import { getData, storeData } from '../offline/offlineStorage';
import { theme, darkTheme } from '../theme';

type ThemeType = 'light' | 'dark' | 'system';

interface ThemeContextType {
    themeType: ThemeType;
    isDark: boolean;
    theme: any; // Exposing the active theme object
    setThemeType: (type: ThemeType) => Promise<void>;
    toggleTheme: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const systemColorScheme = useColorScheme();
    const [themeType, setThemeTypeState] = useState<ThemeType>('light');
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        loadTheme();
    }, []);

    useEffect(() => {
        updateIsDark(themeType);
    }, [themeType, systemColorScheme]);

    const loadTheme = async () => {
        try {
            const storedTheme = await getData('app_theme');
            if (storedTheme) {
                setThemeTypeState(storedTheme as ThemeType);
            }
        } catch (e) {
            console.error('Failed to load theme', e);
        }
    };

    const updateIsDark = (type: ThemeType) => {
        if (type === 'system') {
            setIsDark(systemColorScheme === 'dark');
        } else {
            setIsDark(type === 'dark');
        }
    };

    const setThemeType = async (type: ThemeType) => {
        setThemeTypeState(type);
        await storeData('app_theme', type);
    };

    const toggleTheme = async () => {
        const newType = isDark ? 'light' : 'dark';
        await setThemeType(newType);
    };

    const activeTheme = isDark ? darkTheme : theme;

    return (
        <ThemeContext.Provider value={{ themeType, isDark, theme: activeTheme, setThemeType, toggleTheme }}>
            <PaperProvider theme={activeTheme}>
                {children}
            </PaperProvider>
        </ThemeContext.Provider>
    );
};

export const useAppTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useAppTheme must be used within a ThemeProvider');
    }
    return context;
};
