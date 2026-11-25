import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { BoardSpace } from '../game/types';
import type { TriviaQuestion } from '../game/questions';
import { LANGS, MESSAGES } from './messages';
import type { Lang, Messages } from './messages';
import { QUESTIONS_PT } from './questions.pt';
import { QUESTIONS_GL } from './questions.gl';

const STORAGE_KEY = 'marist-trivial.lang';

/** Idioma guardado o, si no hay, el del navegador (es por defecto). */
function initialLang(): Lang {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'es' || saved === 'pt' || saved === 'gl') return saved;
  } catch {
    // almacenamiento no disponible: se usa el idioma del navegador
  }
  const nav = (typeof navigator !== 'undefined' ? navigator.language : 'es').toLowerCase();
  if (nav.startsWith('gl')) return 'gl';
  if (nav.startsWith('pt')) return 'pt';
  return 'es';
}

interface I18nValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  m: Messages;
}

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(initialLang);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // sin almacenamiento: el idioma vale solo para esta sesión
    }
    document.documentElement.lang = LANGS.find((l) => l.id === lang)?.htmlLang ?? lang;
  }, [lang]);

  const value = useMemo(() => ({ lang, setLang, m: MESSAGES[lang] }), [lang]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n debe usarse dentro de <I18nProvider>');
  return ctx;
}

/** Nombre de una casilla del tablero en el idioma activo. */
export function spaceLabel(space: BoardSpace, m: Messages): string {
  const cat = space.category ? m.categories[space.category].short : '';
  switch (space.kind) {
    case 'hub':
      return m.spaces.hub;
    case 'roll_again':
      return m.spaces.rollAgain;
    case 'hq':
      return m.spaces.hq(cat);
    case 'spoke':
      return m.spaces.spoke(cat);
    default:
      return m.spaces.ring(cat);
  }
}

/** Traducción de una pregunta a cada idioma, con las opciones en el mismo orden. */
export type QuestionTranslation = [
  prompt: string,
  options: [string, string, string, string],
  explanation: string,
];

const QUESTION_TRANSLATIONS: Record<Exclude<Lang, 'es'>, Record<string, QuestionTranslation>> = {
  pt: QUESTIONS_PT,
  gl: QUESTIONS_GL,
};

/** Devuelve la pregunta en el idioma activo (el original es español). */
export function localizeQuestion(q: TriviaQuestion, lang: Lang): TriviaQuestion {
  if (lang === 'es') return q;
  const t = QUESTION_TRANSLATIONS[lang][q.id];
  if (!t) return q;
  return { ...q, prompt: t[0], options: t[1], explanation: t[2] };
}
