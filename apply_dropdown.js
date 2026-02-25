const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, 'styles.css');
let css = fs.readFileSync(cssPath, 'utf8');

if (!css.includes('.lang-dropdown')) {
    css += `
/* Language Dropdown */
.header-left-box { display: flex; align-items: center; gap: 1rem; }
.lang-dropdown { position: relative; }
.lang-dropdown-btn {
    display: flex; align-items: center; gap: 0.4rem;
    background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1);
    color: var(--text); padding: 0.4rem 0.8rem; border-radius: 50px;
    cursor: pointer; font-family: inherit; font-size: 0.9rem; font-weight: 500;
    transition: all 0.3s ease; backdrop-filter: blur(10px);
}
.lang-dropdown-btn:hover { background: rgba(255, 255, 255, 0.1); border-color: rgba(255, 255, 255, 0.2); }
.lang-dropdown-menu {
    position: absolute; top: calc(100% + 10px); left: 0;
    background: rgba(15, 23, 42, 0.95); backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px;
    padding: 0.5rem; display: none; flex-direction: column; gap: 0.2rem;
    min-width: 140px; z-index: 1000; box-shadow: 0 10px 30px rgba(0,0,0,0.5);
}
.lang-dropdown-menu.show { display: flex; animation: fadeIn 0.2s ease; }
.lang-item {
    display: flex; align-items: center; gap: 0.5rem;
    padding: 0.6rem 0.8rem; color: var(--text-muted); text-decoration: none;
    font-size: 0.9rem; border-radius: 8px; transition: all 0.2s ease; font-weight: 500;
}
.lang-item:hover { color: var(--text); background: rgba(255, 255, 255, 0.05); }
.lang-item.active { color: var(--text); background: rgba(99, 102, 241, 0.15); }

@keyframes fadeIn {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
}
`;
    fs.writeFileSync(cssPath, css, 'utf8');
}

const files = ['index.html', 'termos.html', 'privacidade.html', 'seguranca.html', 'delete_account.html'];

for (const file of files) {
    let filepath = path.join(__dirname, file);
    if (!fs.existsSync(filepath)) continue;

    let content = fs.readFileSync(filepath, 'utf8');

    // Completely remove the old inline language selectors
    content = content.replace(/<div class="lang-selector-nav">[\s\S]*?<\/div>/g, '');

    // Un-wrap if we already applied a header-left box previously
    content = content.replace(/<div class="header-left-box">([\s\S]*?)<\/div>/g, (match, inner) => {
        // extract just the logo part if it's there
        const logoMatch = inner.match(/<a href="[^"]*" class="logo">[\s\S]*?<\/a>/);
        return logoMatch ? logoMatch[0] : match;
    });

    const dropdownHtml = `
            <div class="header-left-box">
                <div class="lang-dropdown">
                    <button class="lang-dropdown-btn" onclick="document.getElementById('langMenu').classList.toggle('show')">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" class="icon-globe"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" stroke="currentColor" stroke-width="2"/><path d="M2 12h20" stroke="currentColor" stroke-width="2"/></svg>
                        <span id="currentLangLabel">PT</span>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
                    </button>
                    <div class="lang-dropdown-menu" id="langMenu">
                        <a href="javascript:void(0)" onclick="window.location.href='/'" class="lang-item" data-lang="pt-BR">🇧🇷 Português (PT)</a>
                        <a href="javascript:void(0)" onclick="window.location.href='/en/index.html'" class="lang-item" data-lang="en">🇺🇸 English (EN)</a>
                        <a href="javascript:void(0)" onclick="window.location.href='/es/index.html'" class="lang-item" data-lang="es">🇪🇸 Español (ES)</a>
                    </div>
                </div>`;

    content = content.replace(/<a href="[^"]*" class="logo">[\s\S]*?<img src="(logo_dualis\.png|logo\.png)"[\s\S]*?<\/a>/, (match) => {
        return dropdownHtml + '\n                ' + match + '\n            </div>';
    });

    if (!content.includes('closeDropdownScript')) {
        content = content.replace('</body>', `
    <script id="closeDropdownScript">
        window.addEventListener('click', function(e) {
            if (!e.target.closest('.lang-dropdown')) {
                const menu = document.getElementById('langMenu');
                if (menu) menu.classList.remove('show');
            }
        });
        
        document.addEventListener('DOMContentLoaded', () => {
            const path = window.location.pathname;
            const label = document.getElementById('currentLangLabel');
            if (path.includes('/en/')) label.textContent = 'EN';
            else if (path.includes('/es/')) label.textContent = 'ES';
            else label.textContent = 'PT';
        });
    </script>
</body>`);
    }

    fs.writeFileSync(filepath, content, 'utf8');
}

// Update the update_htmls script so it doesn't break things later
let updateScriptPath = path.join(__dirname, 'update_htmls.js');
if (fs.existsSync(updateScriptPath)) {
    let scriptContent = fs.readFileSync(updateScriptPath, 'utf8');
    // Strip out the lang-selector injection from the update_htmls file so it doesn't recreate the old layout later
    scriptContent = scriptContent.replace(/\/\/ 3\. Add Language Selector[\s\S]*?\/\/ 4\. Inject data-i18n/, '// 4. Inject data-i18n');
    fs.writeFileSync(updateScriptPath, scriptContent, 'utf8');
}

console.log("UI Fixed");
