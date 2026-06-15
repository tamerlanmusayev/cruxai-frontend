'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import i18next from 'i18next';
import { initReactI18next, useTranslation } from 'react-i18next';
import en from '@/messages/en.json';
import ru from '@/messages/ru.json';
import az from '@/messages/az.json';
import tr from '@/messages/tr.json';
import kk from '@/messages/kk.json';
import uz from '@/messages/uz.json';
import ka from '@/messages/ka.json';

export type Lang = 'az' | 'ru' | 'en' | 'tr' | 'kk' | 'uz' | 'ka';
export const LANGS: { code: Lang; label: string }[] = [
  { code: 'az', label: 'AZ' },
  { code: 'ru', label: 'RU' },
  { code: 'en', label: 'EN' },
  { code: 'tr', label: 'TR' },
  { code: 'kk', label: 'KZ' },
  { code: 'uz', label: 'UZ' },
  { code: 'ka', label: 'GE' },
];

if (!i18next.isInitialized) {
  void i18next.use(initReactI18next).init({
    resources: {
      en: { translation: en },
      ru: { translation: ru },
      az: { translation: az },
      tr: { translation: tr },
      kk: { translation: kk },
      uz: { translation: uz },
      ka: { translation: ka },
    },
    lng: 'en',
    fallbackLng: 'en',
    // Our keys are flat dotted strings ("home.title"), not nested namespaces.
    keySeparator: false,
    nsSeparator: false,
    // Single-brace placeholders: {n}, {mb}, {files}, {a}.
    interpolation: { escapeValue: false, prefix: '{', suffix: '}' },
    react: { useSuspense: false },
  });
}

interface Ctx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

const LangContext = createContext<{ lang: Lang; setLang: (l: Lang) => void } | null>(
  null,
);

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('en');

  useEffect(() => {
    const saved = localStorage.getItem('cruxai_lang') as Lang | null;
    if (saved && LANGS.some((l) => l.code === saved)) {
      setLangState(saved);
      void i18next.changeLanguage(saved);
      document.documentElement.lang = saved;
    }
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    void i18next.changeLanguage(l);
    localStorage.setItem('cruxai_lang', l);
    document.documentElement.lang = l;
  };

  return (
    <LangContext.Provider value={{ lang, setLang }}>
      {children}
    </LangContext.Provider>
  );
}

export function useT(): Ctx {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error('useT must be used within LangProvider');
  const { t } = useTranslation();
  return {
    lang: ctx.lang,
    setLang: ctx.setLang,
    t: (key, vars) => t(key, vars ?? undefined) as string,
  };
}
