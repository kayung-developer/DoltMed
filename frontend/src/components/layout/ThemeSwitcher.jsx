import React, { useContext } from 'react';
import { SunIcon, MoonIcon, ComputerDesktopIcon } from '@heroicons/react/24/outline';
import { ThemeContext } from '../../context/ThemeContext'; // Assuming path

const ThemeSwitcher = () => {
    const { theme, setTheme } = useContext(ThemeContext);

    const themes = [
        { name: 'light', icon: SunIcon },
        { name: 'dark', icon: MoonIcon },
        // 'system' theme is handled by initial logic in context, this is a manual override
    ];

    return (
        <div className="flex items-center space-x-2 p-1 bg-gray-200 dark:bg-gray-700 rounded-full">
            {themes.map((t) => (
                <button
                    key={t.name}
                    onClick={() => setTheme(t.name)}
                    className={`p-1.5 rounded-full transition-colors duration-200 ${
                        theme === t.name ? 'bg-white dark:bg-gray-900 shadow-md' : 'hover:bg-gray-300 dark:hover:bg-gray-600'
                    }`}
                >
                    <t.icon className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                    <span className="sr-only">{`Switch to ${t.name} mode`}</span>
                </button>
            ))}
        </div>
    );
};

export default ThemeSwitcher;