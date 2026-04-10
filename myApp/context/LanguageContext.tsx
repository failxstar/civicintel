import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { translations, Language } from '../constants/translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  t: typeof translations.english;
  isLanguageReady: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLangInternal] = useState<Language>('english');
  const [isLanguageReady, setIsLanguageReady] = useState(false);

  useEffect(() => {
    loadLanguage();
  }, []);

  const loadLanguage = async () => {
    try {
      const savedLang = await AsyncStorage.getItem('user_language');
      if (savedLang && (savedLang in translations)) {
        setLangInternal(savedLang as Language);
      }
    } catch (e) {
      console.error('Failed to load language', e);
    } finally {
      setIsLanguageReady(true);
    }
  };

  const setLanguage = async (lang: Language) => {
    try {
      await AsyncStorage.setItem('user_language', lang);
      setLangInternal(lang);
    } catch (e) {
      console.error('Failed to save language', e);
    }
  };

  const t = translations[language] || translations.english;

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isLanguageReady }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
