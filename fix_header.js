const fs = require('fs');
const path = require('path');

const files = ['index.html', 'termos.html', 'privacidade.html', 'seguranca.html', 'delete_account.html'];

for (const file of files) {
    const filepath = path.join(__dirname, file);
    if (!fs.existsSync(filepath)) continue;

    let content = fs.readFileSync(filepath, 'utf8');

    // 1. Remove ALL header-left-box wrappers and lang-dropdown blocks
    //    We'll strip everything between <header> and </header> and rebuild cleanly
    const headerMatch = content.match(/<header class="header">([\s\S]*?)<\/header>/);
    if (!headerMatch) {
        console.log(`No header found in ${file}, skipping.`);
        continue;
    }

    let headerContent = headerMatch[1];

    // Remove all lang-dropdown blocks
    headerContent = headerContent.replace(/<div class="lang-dropdown">[\s\S]*?<\/div>\s*<\/div>/g, '');
    // Remove all header-left-box wrappers but keep inner content
    headerContent = headerContent.replace(/<div class="header-left-box">/g, '');
    // Remove orphan closing divs that belonged to header-left-box (tricky, so let's just rebuild)
    // Remove lang-selector-nav blocks too
    headerContent = headerContent.replace(/<div class="lang-selector-nav">[\s\S]*?<\/div>/g, '');

    // Extract the logo tag
    const logoMatch = headerContent.match(/<a href="[^"]*" class="logo">[\s\S]*?<\/a>/);
    // Extract the nav tag
    const navMatch = headerContent.match(/<nav class="nav">[\s\S]*?<\/nav>/);
    // Extract the btn-glow
    const btnMatch = headerContent.match(/<a href="[^"]*" class="btn btn-glow">[\s\S]*?<\/a>/);
    // Extract mobile menu
    const mobileMatch = headerContent.match(/<button class="mobile-menu"[\s\S]*?<\/button>/);

    if (!logoMatch) {
        console.log(`No logo found in ${file}, skipping.`);
        continue;
    }

    // Clean nav content (remove any leftover empty lines/whitespace)
    let navContent = navMatch ? navMatch[0] : '<nav class="nav"></nav>';
    // Remove any lang stuff still inside nav
    navContent = navContent.replace(/<div class="lang-[\s\S]*?<\/div>/g, '');
    // Clean up empty lines inside nav
    navContent = navContent.replace(/\n\s*\n/g, '\n');

    // Determine the correct links based on which file we're editing
    let ptLink = '/';
    let enLink = '/en/index.html';
    let esLink = '/es/index.html';

    // Build the clean header
    const cleanHeader = `<header class="header">
        <div class="container">
            <div class="header-left-box">
                <div class="lang-dropdown">
                    <button class="lang-dropdown-btn" onclick="document.getElementById('langMenu').classList.toggle('show')">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" stroke="currentColor" stroke-width="2"/><path d="M2 12h20" stroke="currentColor" stroke-width="2"/></svg>
                        <span id="currentLangLabel">PT</span>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
                    </button>
                    <div class="lang-dropdown-menu" id="langMenu">
                        <a href="${ptLink}" class="lang-item" onclick="localStorage.setItem('i18nextLng', 'pt-BR')">🇧🇷 Português</a>
                        <a href="${enLink}" class="lang-item" onclick="localStorage.setItem('i18nextLng', 'en')">🇺🇸 English</a>
                        <a href="${esLink}" class="lang-item" onclick="localStorage.setItem('i18nextLng', 'es')">🇪🇸 Español</a>
                    </div>
                </div>
                ${logoMatch[0]}
            </div>
            ${navContent}
            ${btnMatch ? btnMatch[0] : ''}
            ${mobileMatch ? mobileMatch[0] : ''}
        </div>
    </header>`;

    content = content.replace(/<header class="header">[\s\S]*?<\/header>/, cleanHeader);

    // 2. Remove ALL duplicate closeDropdownScript blocks, keep only one
    const scriptCount = (content.match(/closeDropdownScript/g) || []).length;
    if (scriptCount > 1) {
        // Remove all instances
        content = content.replace(/<script id="closeDropdownScript">[\s\S]*?<\/script>\s*/g, '');
    } else if (scriptCount === 1) {
        // Remove the existing one so we can add a fresh one
        content = content.replace(/<script id="closeDropdownScript">[\s\S]*?<\/script>\s*/g, '');
    }

    // 3. Add a single clean script before </body>
    const dropdownScript = `
    <script id="closeDropdownScript">
        // Close dropdown when clicking outside
        window.addEventListener('click', function(e) {
            if (!e.target.closest('.lang-dropdown')) {
                var menu = document.getElementById('langMenu');
                if (menu) menu.classList.remove('show');
            }
        });
        // Set current language label based on URL path
        (function() {
            var p = window.location.pathname;
            var label = document.getElementById('currentLangLabel');
            if (label) {
                if (p.indexOf('/en') === 0 || p.indexOf('/en/') >= 0) label.textContent = 'EN';
                else if (p.indexOf('/es') === 0 || p.indexOf('/es/') >= 0) label.textContent = 'ES';
                else label.textContent = 'PT';
            }
        })();
    </script>`;

    content = content.replace('</body>', dropdownScript + '\n</body>');

    fs.writeFileSync(filepath, content, 'utf8');
    console.log(`Fixed: ${file}`);
}

console.log('All headers fixed!');
