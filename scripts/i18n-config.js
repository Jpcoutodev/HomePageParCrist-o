const languages = ['pt-BR', 'en', 'es'];
const defaultLanguage = 'pt-BR';

// Mapeamento de traduções de nomes de arquivos para SEO URL Localization
const localizedRoutes = {
    'index.html': { 'en': 'index.html', 'es': 'index.html', 'pt-BR': 'index.html' },
    'termos.html': { 'en': 'terms.html', 'es': 'terminos.html', 'pt-BR': 'termos.html' },
    'privacidade.html': { 'en': 'privacy.html', 'es': 'privacidad.html', 'pt-BR': 'privacidade.html' },
    'seguranca.html': { 'en': 'security.html', 'es': 'seguridad.html', 'pt-BR': 'seguranca.html' },
    'delete_account.html': { 'en': 'delete_account.html', 'es': 'delete_account.html', 'pt-BR': 'delete_account.html' }
};

module.exports = {
    languages,
    defaultLanguage,
    localizedRoutes
};
