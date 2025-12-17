// Main.js - Handles page routing and initialization
document.addEventListener("DOMContentLoaded", function() {
    const menuItems = document.querySelectorAll('.menu-item');
    const pageContent = document.getElementById('pageContent');
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('sidebar');

    // Map of page names to their JavaScript modules
    const pageModules = {
        'users': 'assets/js/user-management.js',
        'dashboard': 'assets/js/dashboard.js',
        'pos': 'assets/js/pos.js',
        'inventory': 'assets/js/inventory.js',
        'issuance': 'assets/js/issuance.js',
        'deliveries': 'assets/js/deliveries.js',
        'reports': 'assets/js/reports.js',
        'history': 'assets/js/history.js',
        'settings': 'assets/js/settings.js',
        'layout': 'assets/js/layout.js'
    };

    // Track loaded scripts to avoid duplicates
    const loadedScripts = new Set();

    /**
     * Load a JavaScript file dynamically
     */
    function loadScript(src) {
        return new Promise((resolve, reject) => {
            if (loadedScripts.has(src)) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = src;
            script.onload = () => {
                loadedScripts.add(src);
                resolve();
            };
            script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
            document.body.appendChild(script);
        });
    }

    /**
     * Update active menu item
     */
    function setActiveMenuItem(pageName) {
        menuItems.forEach(item => {
            const itemPageName = item.getAttribute('data-page');
            item.classList.toggle('active', itemPageName === pageName);
        });
    }

    /**
     * Load a page and its associated JavaScript
     */
    function loadPage(url, pageName) {
        fetch(url)
            .then(response => {
                if (!response.ok) throw new Error("Page not found");
                return response.text();
            })
            .then(html => {
                pageContent.innerHTML = html;

                if (pageName) {
                    // Save last visited page
                    localStorage.setItem('lastPage', pageName);
                    localStorage.setItem('lastPageUrl', url);

                    setActiveMenuItem(pageName);
                }

                // Load associated JS file
                if (pageName && pageModules[pageName]) {
                    return loadScript(pageModules[pageName]);
                }
            })
            .then(() => {
                // Call the page init function if it exists
                if (pageName && window[`init_${pageName}`]) {
                    window[`init_${pageName}`]();
                }
            })
            .catch(err => {
                console.error('Error loading page:', err);
                pageContent.innerHTML = `
                    <div class="alert alert-danger">
                        <i class="fas fa-exclamation-triangle me-2"></i>
                        Error loading page: ${err.message}
                    </div>
                `;
            });
    }

    /**
     * Handle menu item clicks
     */
    menuItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();

            const pageUrl = this.getAttribute('href');
            const pageName = this.getAttribute('data-page');

            loadPage(pageUrl, pageName);
        });
    });

    /**
     * Sidebar toggle for mobile
     */
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', function() {
            sidebar.classList.toggle('collapsed');
        });
    }

    /**
     * Restore last visited page OR load default dashboard
     */
    const lastPage = localStorage.getItem('lastPage');
    const lastPageUrl = localStorage.getItem('lastPageUrl');

    if (lastPage && lastPageUrl) {
        console.log('Restoring last page:', lastPage);
        loadPage(lastPageUrl, lastPage);
    } else {
        console.log('Loading default page: dashboard');
        loadPage('pages/dashboard.html', 'dashboard');
    }
});
