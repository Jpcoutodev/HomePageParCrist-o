const fs = require('fs');
const path = require('path');
const { languages, defaultLanguage, localizedRoutes } = require('./i18n-config.js');

const distDir = path.resolve(__dirname, '../dist');
const localesDir = path.resolve(__dirname, '../locales');
const BASE_URL = 'https://dualis.app';

// Load translations
const translations = {};
languages.forEach(lang => {
    translations[lang] = JSON.parse(fs.readFileSync(path.join(localesDir, `${lang}.json`), 'utf-8'));
});

// Helper to get nested translation
function getTranslation(lang, key) {
    const keys = key.split('.');
    let result = translations[lang];
    for (const k of keys) {
        if (!result) return key;
        result = result[k];
    }
    return result || key;
}

// Ensure dir exists
function ensureDirSync(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

// Generate hreflang tags for all languages for a specific source file
function generateHreflangTags(sourceFile) {
    let tags = '';
    languages.forEach(lang => {
        const localizedName = localizedRoutes[sourceFile][lang] || sourceFile;
        const langPrefix = lang === defaultLanguage ? '' : `/${lang}`;
        const url = `${BASE_URL}${langPrefix}/${localizedName === 'index.html' ? '' : localizedName}`;
        tags += `\n  <link rel="alternate" hreflang="${lang}" href="${url}" />`;
    });
    // x-default is usually the default language
    const defaultLocalizedName = localizedRoutes[sourceFile][defaultLanguage] || sourceFile;
    tags += `\n  <link rel="alternate" hreflang="x-default" href="${BASE_URL}/${defaultLocalizedName === 'index.html' ? '' : defaultLocalizedName}" />`;
    return tags;
}

function processHtmlFile(sourceFileContent, lang, sourceFilename) {
    let content = sourceFileContent;

    // 1. Update <html lang>
    content = content.replace(/<html[^>]*lang="[^"]*"[^>]*>/, (match) => match.replace(/lang="[^"]*"/, `lang="${lang}"`));
    if (!content.includes('lang=')) {
        content = content.replace('<html', `<html lang="${lang}"`);
    }

    // 2. Inject hreflang tags in <head>
    const hreflangTags = generateHreflangTags(sourceFilename);
    content = content.replace('</head>', `${hreflangTags}\n</head>`);

    // 3. Translate data-i18n texts
    // Regex matches data-i18n="key">...<
    content = content.replace(/data-i18n="([^"]+)"([^>]*)>([\s\S]*?)<\//g, (match, key, rest, innerText) => {
        const translatedText = getTranslation(lang, key);
        return `data-i18n="${key}"${rest}>${translatedText}</`;
    });

    // 4. Translate title and meta tags where data-i18n is used
    // Useful if we add data-i18n to meta tags directly or we specifically parse them
    content = content.replace(/<title\s+data-i18n="([^"]+)".*?>(.*?)<\/title>/g, (match, key) => {
        const translatedText = getTranslation(lang, key);
        return `<title>${translatedText}</title>`;
    });
    content = content.replace(/<meta\s+name="description"\s+content="[^"]*"\s+data-i18n="([^"]+)"/g, (match, key) => {
        const translatedText = getTranslation(lang, key);
        return `<meta name="description" content="${translatedText}" data-i18n="${key}"`;
    });
    content = content.replace(/<meta\s+property="og:title"\s+content="[^"]*"\s+data-i18n="([^"]+)"/g, (match, key) => {
        const translatedText = getTranslation(lang, key);
        return `<meta property="og:title" content="${translatedText}" data-i18n="${key}"`;
    });
    content = content.replace(/<meta\s+property="og:description"\s+content="[^"]*"\s+data-i18n="([^"]+)"/g, (match, key) => {
        const translatedText = getTranslation(lang, key);
        return `<meta property="og:description" content="${translatedText}" data-i18n="${key}"`;
    });

    // 5. Replace JS dropdown with static links (if needed statically)
    // This will be handled in the source HTML natively, but if anything dynamic remains, remove i18n script.
    content = content.replace(/<script[^>]*src="[^"]*i18n\.js"[^>]*><\/script>/, '');

    return content;
}

function buildStaticPages() {
    const files = fs.readdirSync(distDir).filter(f => f.endsWith('.html'));

    files.forEach(file => {
        const filePath = path.join(distDir, file);
        const originalContent = fs.readFileSync(filePath, 'utf-8');

        // Default language overwrites the root file or remains the same
        const defaultContent = processHtmlFile(originalContent, defaultLanguage, file);
        fs.writeFileSync(filePath, defaultContent);

        // Other languages go to subfolders
        languages.filter(l => l !== defaultLanguage).forEach(lang => {
            const langDir = path.join(distDir, lang);
            ensureDirSync(langDir);

            const localizedName = localizedRoutes[file][lang] || file;
            const langFilePath = path.join(langDir, localizedName);

            const localizedContent = processHtmlFile(originalContent, lang, file);
            fs.writeFileSync(langFilePath, localizedContent);
        });
    });
}

function generateSitemap() {
    let sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">`;

    const files = Object.keys(localizedRoutes);

    files.forEach(file => {
        languages.forEach(lang => {
            const isDefault = lang === defaultLanguage;
            const langPrefix = isDefault ? '' : `/${lang}`;
            const localizedName = localizedRoutes[file][lang] || file;
            const url = `${BASE_URL}${langPrefix}/${localizedName === 'index.html' ? '' : localizedName}`;

            sitemapContent += `\n  <url>\n    <loc>${url}</loc>`;

            // Add xhtml:link for each language version
            languages.forEach(altLang => {
                const altLocalizedName = localizedRoutes[file][altLang] || file;
                const altLangPrefix = altLang === defaultLanguage ? '' : `/${altLang}`;
                const altUrl = `${BASE_URL}${altLangPrefix}/${altLocalizedName === 'index.html' ? '' : altLocalizedName}`;
                sitemapContent += `\n    <xhtml:link rel="alternate" hreflang="${altLang}" href="${altUrl}" />`;
            });
            // x-default
            const defaultLocalizedName = localizedRoutes[file][defaultLanguage] || file;
            sitemapContent += `\n    <xhtml:link rel="alternate" hreflang="x-default" href="${BASE_URL}/${defaultLocalizedName === 'index.html' ? '' : defaultLocalizedName}" />`;

            sitemapContent += `\n  </url>`;
        });
    });

    sitemapContent += `\n</urlset>`;
    fs.writeFileSync(path.join(distDir, 'sitemap.xml'), sitemapContent);
}

console.log('Generating i18n static pages...');
buildStaticPages();
console.log('Generating multilingual sitemap...');
generateSitemap();
console.log('i18n generation complete!');
