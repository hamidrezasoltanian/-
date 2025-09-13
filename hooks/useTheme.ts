import { useEffect } from 'react';
import { useLocalStorage } from './useLocalStorage.ts';

export type Theme = 'blue' | 'green' | 'indigo' | 'red' | 'dark';

export const useTheme = () => {
    const [theme, setTheme] = useLocalStorage<Theme>('app_theme_v1', 'blue');
    const [backgroundImage, setBackgroundImage] = useLocalStorage<string | null>('app_background_v1', null);

    useEffect(() => {
        const root = document.documentElement;
        // Remove old theme classes
        root.classList.remove('theme-blue', 'theme-green', 'theme-indigo', 'theme-red', 'theme-dark');
        // Add new one
        if (theme !== 'blue') { // blue is the default, no class needed
            root.classList.add(`theme-${theme}`);
        }
    }, [theme]);

    useEffect(() => {
        const styleId = 'dynamic-background-style';
        let styleTag = document.getElementById(styleId) as HTMLStyleElement | null;
        if (!styleTag) {
            styleTag = document.createElement('style');
            styleTag.id = styleId;
            document.head.appendChild(styleTag);
        }
        
        if (backgroundImage) {
            // Using JSON.stringify to correctly escape the string for CSS url()
            styleTag.innerHTML = `body::before { background-image: url(${JSON.stringify(backgroundImage)}); }`;
        } else {
            styleTag.innerHTML = `body::before { background-image: none; }`;
        }
    }, [backgroundImage]);

    return { theme, setTheme, backgroundImage, setBackgroundImage };
};
