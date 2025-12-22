// assets/js/main.js
// ============================================
// ROLE-BASED ACCESS CONTROL FUNCTIONS
// ============================================

function getUserPermissions() {
    const permissionsStr = sessionStorage.getItem('permissions');
    return permissionsStr ? JSON.parse(permissionsStr) : {};
}

function hasPermission(page) {
    const permissions = getUserPermissions();
    return permissions[page] === true;
}

function canModify(page) {
    const permissions = getUserPermissions();
    const userRole = getUserRole().toLowerCase();
    
    // Administrator and Manager can modify everything
    if (userRole === 'administrator' || userRole === 'manager') {
        return true;
    }
    
    // Supervisor can only modify POS
    if (userRole === 'supervisor') {
        return permissions.can_modify && permissions.can_modify.includes(page);
    }
    
    // Recruiter can modify POS
    if (userRole === 'recruiter') {
        return page === 'pos';
    }
    
    return false;
}

function getUserRole() {
    return sessionStorage.getItem('userRole') || '';
}

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
        isLoggedIn: isLoggedIn,
        userRole: getUserRole()
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
        window.location.href = '../index.php';
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
// APPLY ROLE-BASED UI RESTRICTIONS
// ============================================

function applyReadOnlyMode(pageName) {
    const userRole = getUserRole().toLowerCase();
    
    if (userRole === 'supervisor' && pageName !== 'pos') {
        setTimeout(() => {
            const pageContent = document.getElementById('pageContent');
            if (pageContent) {
                // Add read-only banner at the top
                const banner = document.createElement('div');
                banner.className = 'read-only-banner';
                banner.innerHTML = `
                    <i class="fas fa-eye"></i>
                    <span><strong>View Only Mode</strong> - You can search and view data, but cannot make changes. Use POS to issue uniforms.</span>
                `;
                pageContent.insertBefore(banner, pageContent.firstChild);
                
                // Mark page as read-only mode
                pageContent.classList.add('read-only-mode');
                
                // Function to hide action buttons and columns
                function hideActionElements() {
                    // Remove/hide action buttons
                    const actionButtons = pageContent.querySelectorAll(`
                        button.btn-primary:not(.search-btn):not(.filter-btn):not(.btn-search):not(.btn-filter),
                        button.btn-success,
                        button.btn-danger,
                        button.btn-warning,
                        button.btn-info:not(.search-btn):not(.filter-btn),
                        .btn-add,
                        .btn-create,
                        .btn-edit,
                        .btn-delete,
                        .btn-update,
                        .btn-save,
                        .btn-submit,
                        .action-button,
                        .action-buttons button,
                        a.btn-primary:not(.search-btn):not(.filter-btn),
                        a.btn-success,
                        a.btn-danger,
                        a.btn-warning
                    `);
                    
                    actionButtons.forEach(btn => {
                        // Double check it's not a search/filter button
                        const btnText = btn.textContent.toLowerCase();
                        if (!btnText.includes('search') && 
                            !btnText.includes('filter') && 
                            !btnText.includes('find') &&
                            !btn.classList.contains('search-btn') &&
                            !btn.classList.contains('filter-btn')) {
                            btn.style.display = 'none';
                            btn.disabled = true;
                        }
                    });
                    
                    // Hide action columns in tables (Edit/Delete columns)
                    const actionHeaders = pageContent.querySelectorAll('th');
                    actionHeaders.forEach((th, index) => {
                        const headerText = th.textContent.toLowerCase();
                        if (headerText.includes('action') || headerText.includes('edit') || headerText.includes('delete')) {
                            th.style.display = 'none';
                            
                            // Hide corresponding cells in all rows
                            const table = th.closest('table');
                            if (table) {
                                const rows = table.querySelectorAll('tbody tr');
                                rows.forEach(row => {
                                    const cells = row.querySelectorAll('td');
                                    if (cells[index]) {
                                        cells[index].style.display = 'none';
                                    }
                                });
                            }
                        }
                    });
                }
                
                // Initial hiding
                hideActionElements();
                
                // Disable form inputs but keep search/filter inputs enabled
                const allInputs = pageContent.querySelectorAll('input, select, textarea');
                allInputs.forEach(input => {
                    // Check if it's a search/filter input or any data filtering element
                    const isSearchFilter = 
                        input.classList.contains('search-input') ||
                        input.classList.contains('filter-select') ||
                        input.classList.contains('search') ||
                        input.classList.contains('filter') ||
                        input.classList.contains('form-select') || // Keep dropdowns for filtering
                        input.type === 'search' ||
                        input.type === 'date' || // Keep date pickers for filtering
                        input.type === 'checkbox' && input.closest('.filter-box') || // Keep filter checkboxes
                        input.placeholder?.toLowerCase().includes('search') ||
                        input.placeholder?.toLowerCase().includes('filter') ||
                        input.closest('.search-box') ||
                        input.closest('.filter-box') ||
                        input.closest('.filter-section') ||
                        input.closest('.search-section') ||
                        input.id?.toLowerCase().includes('filter') ||
                        input.id?.toLowerCase().includes('search') ||
                        input.name?.toLowerCase().includes('filter') ||
                        input.name?.toLowerCase().includes('search');
                    
                    // Additional check: if it's in a table header (likely a filter)
                    const isInTableHeader = input.closest('thead') !== null;
                    
                    if (!isSearchFilter && !isInTableHeader) {
                        input.disabled = true;
                        input.style.opacity = '0.6';
                        input.style.cursor = 'not-allowed';
                    }
                });
                
                // Watch for dynamically added content (like filtered results)
                const observer = new MutationObserver((mutations) => {
                    mutations.forEach((mutation) => {
                        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                            // Re-apply hiding to newly added elements
                            hideActionElements();
                        }
                    });
                });
                
                // Start observing the page content for changes
                observer.observe(pageContent, {
                    childList: true,
                    subtree: true
                });
                
                // Store observer reference to disconnect later if needed
                pageContent._readOnlyObserver = observer;
                
                console.log('Read-only mode applied with mutation observer for supervisor on:', pageName);
            }
        }, 100);
    }
}

function applyRoleBasedUI() {
    const permissions = getUserPermissions();
    const userRole = getUserRole();
    
    console.log('Applying role-based UI for:', userRole, permissions);
    
    // Hide menu items based on permissions
    document.querySelectorAll('.menu-item').forEach(item => {
        const page = item.getAttribute('data-page');
        
        if (page && !hasPermission(page)) {
            item.style.display = 'none';
        } else {
            item.style.display = 'flex';
        }
    });
    
    // Update user display
    const userNameElements = document.querySelectorAll('.user-name, .navbar .dropdown-toggle span');
    userNameElements.forEach(el => {
        const userName = sessionStorage.getItem('userName');
        if (userName) {
            el.textContent = userName;
        }
    });
    
    // Add role badge
    const userDropdown = document.querySelector('.navbar .dropdown-toggle');
    if (userDropdown && userRole) {
        let roleBadge = userDropdown.querySelector('.role-badge');
        if (!roleBadge) {
            roleBadge = document.createElement('span');
            roleBadge.className = 'badge bg-primary role-badge ms-2';
            roleBadge.style.fontSize = '0.7rem';
            userDropdown.appendChild(roleBadge);
        }
        roleBadge.textContent = userRole;
    }
}

// ============================================
// SESSION VERIFICATION ON PAGE LOAD
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    const isLoggedIn = sessionStorage.getItem('isLoggedIn');
    
    if (isLoggedIn === 'true') {
        // Apply role-based UI immediately
        applyRoleBasedUI();
        
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
// PAGE ROUTING WITH PERMISSION CHECK
// ============================================

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
     * Load a page with permission check
     */
    function loadPage(url, pageName) {
        // Check permission before loading
        if (pageName && !hasPermission(pageName)) {
            pageContent.innerHTML = `
                <div class="alert alert-warning">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    <strong>Access Denied</strong>
                    <p>You don't have permission to access this page.</p>
                    <p>Your role: <strong>${getUserRole()}</strong></p>
                </div>
            `;
            return;
        }

        fetch(url)
            .then(response => {
                if (!response.ok) throw new Error("Page not found");
                return response.text();
            })
            .then(html => {
                pageContent.innerHTML = html;

                // Apply read-only mode for supervisors on non-POS pages
                const userRole = getUserRole().toLowerCase();
                if (userRole === 'supervisor' && pageName !== 'pos') {
                    applyReadOnlyMode(pageName);
                }

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
     * Handle menu item clicks with permission check
     */
    menuItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();

            const pageUrl = this.getAttribute('href');
            const pageName = this.getAttribute('data-page');

            // Double-check permission
            if (pageName && !hasPermission(pageName)) {
                alert('Access Denied: You do not have permission to access this page.');
                return;
            }

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
     * Load initial page based on role
     */
    const urlParams = new URLSearchParams(window.location.search);
    const requestedPage = urlParams.get('page');
    
    if (requestedPage && hasPermission(requestedPage)) {
        // Load requested page if permitted
        loadPage(`pages/${requestedPage}.html`, requestedPage);
    } else {
        // Load default page based on role
        const userRole = getUserRole().toLowerCase();
        
        if (userRole === 'recruiter') {
            // Recruiters start at POS
            loadPage('pages/pos.html', 'pos');
        } else {
            // Others start at dashboard
            const lastPage = localStorage.getItem('lastPage');
            const lastPageUrl = localStorage.getItem('lastPageUrl');
            
            if (lastPage && lastPageUrl && hasPermission(lastPage)) {
                loadPage(lastPageUrl, lastPage);
            } else {
                loadPage('pages/dashboard.html', 'dashboard');
            }
        }
    }
});

window.onpopstate = () => {
    const lastPage = localStorage.getItem('lastPage');
    const lastUrl = localStorage.getItem('lastPageUrl');

    if (lastPage && lastUrl && hasPermission(lastPage)) {
        loadPage(lastUrl, lastPage);
    }
};