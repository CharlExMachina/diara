import Conf from 'conf';
import en from './locales/en.json';
import es from './locales/es.json';

// Supported languages
export const SUPPORTED_LANGUAGES = ['en', 'es'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

// Type for the locale structure (inferred from English as source of truth)
type LocaleStrings = typeof en;

const locales: Record<SupportedLanguage, LocaleStrings> = {
  en,
  es
};

// Config for persisting language preference
interface I18nConfigSchema {
  language: SupportedLanguage | 'system';
}

const config = new Conf<I18nConfigSchema>({
  projectName: 'diara',
  projectSuffix: '',
  schema: {
    language: {
      type: 'string',
      default: 'system'
    }
  }
});

// Detect system language
const detectSystemLanguage = (): SupportedLanguage => {
  // Check common environment variables for locale
  const envLang = process.env.LANG || process.env.LANGUAGE || process.env.LC_ALL || process.env.LC_MESSAGES || '';
  const langCode = envLang.split('_')[0]?.toLowerCase() || '';

  if (langCode === 'es') {
    return 'es';
  }

  // Default to English for any other language
  return 'en';
};

// Get current language
export const getCurrentLanguage = (): SupportedLanguage => {
  const saved = config.get('language');
  if (saved === 'system') {
    return detectSystemLanguage();
  }
  return saved;
};

// Set language preference
export const setLanguage = (lang: SupportedLanguage | 'system') => {
  config.set('language', lang);
};

// Get language setting (including 'system' option)
export const getLanguageSetting = (): SupportedLanguage | 'system' => {
  return config.get('language');
};

// Get current locale strings
const getCurrentLocale = (): LocaleStrings => {
  return locales[getCurrentLanguage()];
};

// Simple template interpolation: replaces {{key}} with values
const interpolate = (template: string, values: Record<string, string | number>): string => {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    return String(values[key] ?? `{{${key}}}`);
  });
};

// Type-safe path accessor for nested objects
type PathsToStringProps<T> = T extends string
  ? []
  : {
      [K in Extract<keyof T, string>]: [K, ...PathsToStringProps<T[K]>];
    }[Extract<keyof T, string>];

type Join<T extends string[], D extends string> = T extends []
  ? never
  : T extends [infer F]
    ? F
    : T extends [infer F, ...infer R]
      ? F extends string
        ? R extends string[]
          ? `${F}${D}${Join<R, D>}`
          : never
        : never
      : string;

export type TranslationKey = Join<PathsToStringProps<LocaleStrings>, '.'>;

// Get nested value by dot-notation path
const getNestedValue = (obj: LocaleStrings, path: string): string => {
  const keys = path.split('.');
  let current: unknown = obj;

  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = (current as Record<string, unknown>)[key];
    } else {
      return path; // Return path as fallback if not found
    }
  }

  return typeof current === 'string' ? current : path;
};

// Main translation function
export const t = (key: TranslationKey, values?: Record<string, string | number>): string => {
  const locale = getCurrentLocale();
  const template = getNestedValue(locale, key);

  if (values) {
    return interpolate(template, values);
  }

  return template;
};

// Get language display name
export const getLanguageDisplayName = (lang: SupportedLanguage | 'system'): string => {
  if (lang === 'system') {
    const detected = detectSystemLanguage();
    const locale = locales[detected];
    return `System (${locale.languages[detected]})`;
  }
  const locale = locales[lang];
  return locale.languages[lang];
};
