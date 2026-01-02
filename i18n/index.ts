// i18n/index.ts
import * as Localization from 'expo-localization';
import en from './en.json';
import pt from './pt.json';

export type TranslationKey = string;
export type Translations = typeof pt;

const translations: Record<string, Translations> = {
  'en': en as Translations,
  'pt': pt as Translations,
  'pt-BR': pt as Translations,
  'pt-PT': pt as Translations,
  'en-US': en as Translations,
  'en-GB': en as Translations,
};

// Função para detectar o idioma do dispositivo
function getDeviceLanguage(): string {
  const locale = Localization.getLocales()[0];
  const languageCode = locale?.languageCode || 'en';
  
  // Se for português, retorna 'pt', senão retorna 'en'
  if (languageCode.startsWith('pt')) {
    return 'pt';
  }
  
  return 'en';
}

// Função para obter tradução
export function t(key: string, params?: Record<string, string | number>): string {
  const lang = getDeviceLanguage();
  const translation = translations[lang] || translations['en'];
  
  // Navegar pela estrutura do objeto usando o caminho da chave
  const keys = key.split('.');
  let value: any = translation;
  
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      // Fallback para inglês se a chave não for encontrada
      const enValue: any = translations['en'];
      let fallbackValue = enValue;
      for (const fallbackKey of keys) {
        if (fallbackValue && typeof fallbackValue === 'object' && fallbackKey in fallbackValue) {
          fallbackValue = fallbackValue[fallbackKey];
        } else {
          return key; // Retorna a chave se não encontrar tradução
        }
      }
      value = fallbackValue;
      break;
    }
  }
  
  if (typeof value !== 'string') {
    return key;
  }
  
  // Substituir parâmetros {param} por valores
  if (params) {
    return value.replace(/\{(\w+)\}/g, (match, paramKey) => {
      return params[paramKey]?.toString() || match;
    });
  }
  
  return value;
}

// Hook para usar traduções (opcional, para compatibilidade futura)
export function useTranslation() {
  return {
    t,
    locale: getDeviceLanguage(),
  };
}

export default { t, useTranslation };







