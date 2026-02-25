import i18next from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translations
import ptBR from './locales/pt-BR.json';
import en from './locales/en.json';
import es from './locales/es.json';

i18next
  .use(LanguageDetector)
  .init({
    resources: {
      'pt-BR': { translation: ptBR },
      en: { translation: en },
      es: { translation: es }
    },
    fallbackLng: 'en', // Changed to English as fallback
    supportedLngs: ['pt-BR', 'en', 'es'],
    detection: {
      order: ['querystring', 'localStorage', 'htmlTag', 'path', 'navigator'],
      caches: ['localStorage']
    }
  }).then(() => {
    updateContent();
    updateLanguageLabel();
  });

function updateContent() {
  document.querySelectorAll('[data-i18n]').forEach((element) => {
    const key = element.getAttribute('data-i18n');
    const translation = i18next.t(key);
    if (translation && translation !== key) {
      element.innerHTML = translation;
    }
  });

  // Set html lang attribute
  document.documentElement.lang = i18next.language;
}

function updateLanguageLabel() {
  const label = document.getElementById('currentLangLabel');
  if (label) {
    const currentLang = i18next.language;
    if (currentLang === 'pt-BR' || currentLang === 'pt') {
      label.textContent = 'PT';
    } else if (currentLang === 'en') {
      label.textContent = 'EN';
    } else if (currentLang === 'es') {
      label.textContent = 'ES';
    }
  }
}

// Function to change language
export const changeLanguage = (lng) => {
  i18next.changeLanguage(lng).then(() => {
    updateContent();
    updateLanguageLabel();
  });
};

// Make it globally available
window.changeLanguage = changeLanguage;
