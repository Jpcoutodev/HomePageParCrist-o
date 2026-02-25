const fs = require('fs');
const path = require('path');

const files = ['index.html', 'termos.html', 'privacidade.html', 'seguranca.html', 'delete_account.html'];

for (const file of files) {
    let filepath = path.join(__dirname, file);
    if (!fs.existsSync(filepath)) continue;

    let content = fs.readFileSync(filepath, 'utf8');

    // Remove duplicate data-i18n attributes
    content = content.replace(/(data-i18n="[^"]*")\s+\1/g, '$1');

    // In index.html, remove the dropdown inside <nav> since it's already in header-left
    if (file === 'index.html') {
        const navDropdownRegex = /<nav class="nav">[\s\S]*?(<div class="lang-dropdown">[\s\S]*?<\/div>)\s*<\/nav>/;
        content = content.replace(navDropdownRegex, (match, dropdown) => {
            return match.replace(dropdown, '');
        });
    }

    fs.writeFileSync(filepath, content, 'utf8');
}

console.log('Cleanup complete.');
