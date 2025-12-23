// assets/js/main.js
// ============================================
// ENHANCED ROLE-BASED ACCESS CONTROL WITH PER-USER PERMISSIONS
// ============================================

function getUserPermissions() {
    const permissionsStr = sessionStorage.getItem('permissions');
    return permissionsStr ? JSON.parse(permissionsStr) : {};
}

function hasPermission(page) {
    const permissions = getUserPermissions();
    // User can access if they have view permission
    return permissions[page] === true;
}

function canModify(page) {
    const permissions = getUserPermissions();
    const userRole = getUserRole().toLowerCase();
    
    // Administrator and Manager can modify everything they can view
    if (userRole === 'administrator' || userRole === 'manager') {
        return permissions[page] === true;
    }
    
    // Check if user has modify permissions for this specific page
    if (permissions.can_modify && permissions.can_modify.includes(page)) {
        return true;
    }
    
    return false;
}

function canAdd(page) {
    // Check if user has add permission (stored in session from backend)
    const userPermissions = sessionStorage.getItem('user_permissions');
    if (!userPermissions) return canModify(page);
    
    try {
        const perms = JSON.parse(userPermissions);
        return perms[page]?.add === true;
    } catch {
        return canModify(page);
    }
}

function canEdit(page) {
    // Check if user has edit permission
    const userPermissions = sessionStorage.getItem('user_permissions');
    if (!userPermissions) return canModify(page);
    
    try {
        const perms = JSON.parse(userPermissions);
        return perms[page]?.edit === true;
    } catch {
        return canModify(page);
    }
}

function canDelete(page) {
    // Check if user has delete permission
    const userPermissions = sessionStorage.getItem('user_permissions');
    if (!userPermissions) return canModify(page);
    
    try {
        const perms = JSON.parse(userPermissions);
        return perms[page]?.delete === true;
    } catch {
        return canModify(page);
    }
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
    
    if (!isLoginPage && (!isLoggedIn || isLoggedIn !== 'true')) {
        console.log('Not logged in - redirecting to login');
        window.location.href = 'pages/login.html';
        return;
    }
    
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
    
    sessionStorage.clear();
    localStorage.clear();
    
    fetch('controller/logout.php')
        .then(() => {
            window.location.href = 'pages/login.html';
        })
        .catch(() => {
            window.location.href = 'pages/login.html';
        });
}

// ============================================
// APPLY ROLE-BASED UI RESTRICTIONS WITH GRANULAR PERMISSIONS
// ============================================

function applyReadOnlyMode(pageName) {
    // Check if user can modify this specific page
    if (canModify(pageName)) {
        console.log(`User can modify ${pageName} - no restrictions applied`);
        return;
    }
    
    // User can only view - apply read-only mode
    setTimeout(() => {
        const pageContent = document.getElementById('pageContent');
        if (pageContent) {
            // Add read-only banner
            const banner = document.createElement('div');
            // banner.className = 'read-only-banner';
            banner.innerHTML = `
                <i class="fas fa-eye"></i>
                <span><strong>View Only Mode</strong> - You can search and view data, but cannot make changes.</span>
            `;
            pageContent.insertBefore(banner, pageContent.firstChild);
            
            pageContent.classList.add('read-only-mode');
            
            // Function to hide/disable action elements
            function applyRestrictions() {
                // Hide add buttons if user can't add
                if (!canAdd(pageName)) {
                    const addButtons = pageContent.querySelectorAll(`
                        button.btn-add,
                        button.btn-create,
                        .btn-primary:not(.search-btn):not(.filter-btn),
                        a.btn-primary:not(.search-btn)
                    `);
                    addButtons.forEach(btn => {
                        const btnText = btn.textContent.toLowerCase();
                        if (btnText.includes('add') || btnText.includes('create') || btnText.includes('new')) {
                            btn.style.display = 'none';
                            btn.disabled = true;
                        }
                    });
                }
                
                // Hide edit buttons if user can't edit
                if (!canEdit(pageName)) {
                    const editButtons = pageContent.querySelectorAll(`
                        button.btn-edit,
                        button.btn-warning,
                        a.btn-warning
                    `);
                    editButtons.forEach(btn => {
                        btn.style.display = 'none';
                        btn.disabled = true;
                    });
                }
                
                // Hide delete buttons if user can't delete
                if (!canDelete(pageName)) {
                    const deleteButtons = pageContent.querySelectorAll(`
                        button.btn-delete,
                        button.btn-danger,
                        a.btn-danger
                    `);
                    deleteButtons.forEach(btn => {
                        btn.style.display = 'none';
                        btn.disabled = true;
                    });
                }
                
                // Hide action columns in tables
                const actionHeaders = pageContent.querySelectorAll('th');
                actionHeaders.forEach((th, index) => {
                    const headerText = th.textContent.toLowerCase();
                    if (headerText.includes('action')) {
                        // Check which actions user can perform
                        const hasAnyPermission = canAdd(pageName) || canEdit(pageName) || canDelete(pageName);
                        
                        if (!hasAnyPermission) {
                            th.style.display = 'none';
                            
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
                    }
                });
            }
            
            // Initial application
            applyRestrictions();
            
            // Disable form inputs (but keep search/filter inputs enabled)
            const allInputs = pageContent.querySelectorAll('input, select, textarea');
            allInputs.forEach(input => {
                const isSearchFilter = 
                    input.classList.contains('search-input') ||
                    input.classList.contains('filter-select') ||
                    input.type === 'search' ||
                    input.type === 'date' ||
                    input.closest('.search-box') ||
                    input.closest('.filter-box');
                
                if (!isSearchFilter) {
                    input.disabled = true;
                    input.style.opacity = '0.6';
                    input.style.cursor = 'not-allowed';
                }
            });
            
            // Watch for dynamic content
            const observer = new MutationObserver(() => {
                applyRestrictions();
            });
            
            observer.observe(pageContent, {
                childList: true,
                subtree: true
            });
            
            pageContent._readOnlyObserver = observer;
            
            console.log('Read-only mode applied for:', pageName);
        }
    }, 100);
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
    
    // // Update user display
    // const userNameElements = document.querySelectorAll('.user-name, .navbar .dropdown-toggle span');
    // userNameElements.forEach(el => {
    //     const userName = sessionStorage.getItem('userName');
    //     if (userName) {
    //         el.textContent = userName;
    //     }
    // });
    
    // Add role badge
    // const userDropdown = document.querySelector('.navbar .dropdown-toggle');
    // if (userDropdown && userRole) {
    //     let roleBadge = userDropdown.querySelector('.role-badge');
    //     if (!roleBadge) {
    //         roleBadge = document.createElement('span');
    //         roleBadge.className = 'badge bg-primary role-badge ms-2';
    //         roleBadge.style.fontSize = '0.7rem';
    //         userDropdown.appendChild(roleBadge);
    //     }
    //     roleBadge.textContent = userRole;
    // }
}

// ============================================
// SESSION VERIFICATION ON PAGE LOAD
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    const isLoggedIn = sessionStorage.getItem('isLoggedIn');
    
    if (isLoggedIn === 'true') {
        applyRoleBasedUI();
        
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

    const loadedScripts = new Set();

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

    function setActiveMenuItem(pageName) {
        menuItems.forEach(item => {
            const itemPageName = item.getAttribute('data-page');
            item.classList.toggle('active', itemPageName === pageName);
        });
    }

    function loadPage(url, pageName) {
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

                // Apply read-only mode if user can't modify
                if (pageName && !canModify(pageName)) {
                    applyReadOnlyMode(pageName);
                }

                if (pageName) {
                    localStorage.setItem('lastPage', pageName);
                    localStorage.setItem('lastPageUrl', url);
                    setActiveMenuItem(pageName);
                }

                if (pageName && pageModules[pageName]) {
                    return loadScript(pageModules[pageName]);
                }
            })
            .then(() => {
                if (pageName && typeof window[`init_${pageName}`] === 'function') {
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

    menuItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();

            const pageUrl = this.getAttribute('href');
            const pageName = this.getAttribute('data-page');

            if (pageName && !hasPermission(pageName)) {
                alert('Access Denied: You do not have permission to access this page.');
                return;
            }

            loadPage(pageUrl, pageName);
        });
    });

    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', function() {
            sidebar.classList.toggle('collapsed');
        });
    }

    // Load initial page
    const urlParams = new URLSearchParams(window.location.search);
    const requestedPage = urlParams.get('page');
    
    if (requestedPage && hasPermission(requestedPage)) {
        loadPage(`pages/${requestedPage}.html`, requestedPage);
    } else {
        const lastPage = localStorage.getItem('lastPage');
        const lastPageUrl = localStorage.getItem('lastPageUrl');
        
        if (lastPage && lastPageUrl && hasPermission(lastPage)) {
            loadPage(lastPageUrl, lastPage);
        } else {
            loadPage('pages/dashboard.html', 'dashboard');
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

// Make permission functions globally accessible
window.hasPermission = hasPermission;
window.canModify = canModify;
window.canAdd = canAdd;
window.canEdit = canEdit;
window.canDelete = canDelete;