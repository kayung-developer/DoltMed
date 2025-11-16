import React from 'react';
import { useTranslation } from 'react-i18next';
import { GlobeAltIcon } from '@heroicons/react/24/outline';

const languages = [
  { code: 'en', name: 'English' }, { code: 'fr', name: 'Français' }, { code: 'es', name: 'Español' },
  { code: 'zh', name: '中文' }, { code: 'ja', name: '日本語' }, { code: 'ko', name: '한국어' },
  { code: 'ru', name: 'Русский' }, { code: 'it', name: 'Italiano' }, { code: 'fi', name: 'Suomi' },
];

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div className="relative">
      <select
        onChange={(e) => changeLanguage(e.target.value)}
        value={i18n.language}
        className="appearance-none cursor-pointer bg-transparent border-none text-gray-600 dark:text-gray-300 focus:ring-0 pr-8"
      >
        {languages.map(lang => (
          <option key={lang.code} value={lang.code} className="bg-white dark:bg-gray-800">
            {lang.name}
          </option>
        ))}
      </select>
      <GlobeAltIcon className="w-5 h-5 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500" />
    </div>
  );
};

export default LanguageSwitcher;