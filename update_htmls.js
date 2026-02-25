const fs = require('fs');
const path = require('path');

const files = ['index.html', 'termos.html', 'privacidade.html', 'seguranca.html', 'delete_account.html'];
const ptBR = require('./locales/pt-BR.json');

const langSelectorHtml = `
            <div class="lang-dropdown">
                <button class="lang-dropdown-btn">
                    <svg viewBox="0 0 24 24" fill="none" class="icon-globe">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" stroke="currentColor" stroke-width="2"/>
                        <path d="M2 12h20" stroke="currentColor" stroke-width="2"/>
                    </svg>
                    <span>PT</span>
                    <svg viewBox="0 0 24 24" fill="none" class="icon-chevron">
                        <path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </button>
                <div class="lang-dropdown-menu">
                    <a href="/" class="lang-item active" data-lang="pt-BR">
                        <span class="flag">🇧🇷</span> Português
                    </a>
                    <a href="/en" class="lang-item" data-lang="en">
                        <span class="flag">🇺🇸</span> English
                    </a>
                    <a href="/es" class="lang-item" data-lang="es">
                        <span class="flag">🇪🇸</span> Español
                    </a>
                </div>
            </div>`;

function flattenObject(ob) {
    let toReturn = {};
    for (let i in ob) {
        if (!ob.hasOwnProperty(i)) continue;
        if ((typeof ob[i]) == 'object' && ob[i] !== null) {
            let flatObject = flattenObject(ob[i]);
            for (let x in flatObject) {
                if (!flatObject.hasOwnProperty(x)) continue;
                toReturn[i + '.' + x] = flatObject[x];
            }
        } else {
            toReturn[i] = ob[i];
        }
    }
    return toReturn;
}

const flatTranslations = flattenObject(ptBR);
// sort from longest to shortest text to avoid partial replacements
const sortedTranslations = Object.entries(flatTranslations).sort((a, b) => b[1].length - a[1].length);

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

for (const file of files) {
    let filepath = path.join(__dirname, file);
    if (!fs.existsSync(filepath)) continue;

    let content = fs.readFileSync(filepath, 'utf8');

    // 1. Replace email
    content = content.replace(/coutodev7@gmail\.com/g, 'dualis.love.app@gmail.com');

    // 2. Add script tag
    if (!content.includes('i18n.js')) {
        content = content.replace('</head>', '    <script type="module" src="/i18n.js"></script>\n</head>');
    }

    // 4. Inject data-i18n (naive approach but effective for this context)
    for (const [key, text] of sortedTranslations) {
        const escapedText = escapeRegExp(text);

        const regex = new RegExp(`>(\\s*${escapedText}\\s*)<`, 'g');
        content = content.replace(regex, (match, p1) => {
            return ` data-i18n="${key}">${p1}<`;
        });

        // Also look for things like title="Text" or content="Text" inside meta
        const metaRegex = new RegExp(`(content|title)="(${escapedText})"`, 'g');
        content = content.replace(metaRegex, (match, attr, p2) => {
            return `${attr}="${p2}" data-i18n="${key}"`;
        });
    }

    fs.writeFileSync(filepath, content, 'utf8');
}

console.log('HTML files updated with i18n tags and configurations.');
