// Add this at the VERY TOP of assets/js/main.js
// This protects ALL pages including index.html, dashboard, and all other pages

// ============================================
// AUTHENTICATION GUARD - MUST BE AT THE TOP
// ============================================

(function() {
    const currentPage = window.location.pathname;
    const isLoginPage = currentPage.includes('login.html');
    const isLoggedIn = sessionStorage.getItem('isLoggedIn');
    
    console.log('Auth Guard Check:', {
        currentPage: currentPage,
        isLoginPage: isLoginPage,
        isLoggedIn: isLoggedIn
    });
    
    // If not on login page and not logged in, redirect to login
    if (!isLoginPage && (!isLoggedIn || isLoggedIn !== 'true')) {
        console.log('Not logged in - redirecting to login');
        window.location.href = 'pages/login.html';
        return;
    }
    
    // If on login page and already logged in, redirect to main page
    if (isLoginPage && isLoggedIn === 'true') {
        console.log('Already logged in - redirecting to index');
        window.location.href = '../index.html';
        return;
    }
})();

// ============================================
// LOGOUT FUNCTION
// ============================================

function logout() {
    console.log('Logging out...');
    
    // Clear client-side session
    sessionStorage.clear();
    localStorage.clear();
    
    // Call server-side logout
    fetch('controller/logout.php')
        .then(() => {
            window.location.href = 'pages/login.html';
        })
        .catch(() => {
            // Force redirect even if request fails
            window.location.href = 'pages/login.html';
        });
}

// ============================================
// SESSION VERIFICATION ON PAGE LOAD
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    const isLoggedIn = sessionStorage.getItem('isLoggedIn');
    
    if (isLoggedIn === 'true') {
        // Verify with server that session is still valid
        fetch('controller/verify-session.php')
            .then(response => response.json())
            .then(data => {
                if (!data.valid) {
                    console.log('Session expired on server');
                    sessionStorage.clear();
                    window.location.href = 'pages/login.html';
                } else {
                    console.log('Session valid:', data.user);
                    
                    // Update UI with user info if elements exist
                    const userNameElement = document.querySelector('.user-name');
                    if (userNameElement && data.user.name) {
                        userNameElement.textContent = data.user.name;
                    }
                }
            })
            .catch(err => {
                console.error('Session verification failed:', err);
            });
    }
    
    // Attach logout to all logout links
    const logoutLinks = document.querySelectorAll('a[href*="logout"]');
    logoutLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            logout();
        });
    });
});

// ============================================
// YOUR EXISTING MAIN.JS CODE CONTINUES BELOW
// ============================================

// Rest of your existing main.js code...

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
                if (pageName && typeof window[`init_${pageName}`] === 'function') {
                    // Ensure DOM is fully painted
                    requestAnimationFrame(() => {
                        window[`init_${pageName}`]();
                    });
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
window.onpopstate = () => {
    const lastPage = localStorage.getItem('lastPage');
    const lastUrl = localStorage.getItem('lastPageUrl');

    if (lastPage && lastUrl) {
        loadPage(lastUrl, lastPage);
    }
};


