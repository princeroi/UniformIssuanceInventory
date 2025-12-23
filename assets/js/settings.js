// assets/js/settings.js

// Available pages in the system
const AVAILABLE_PAGES = [
    { name: 'dashboard', label: 'Dashboard', icon: 'fa-chart-line' },
    { name: 'users', label: 'User Management', icon: 'fa-users' },
    { name: 'pos', label: 'Point of Sale', icon: 'fa-shopping-cart' },
    { name: 'inventory', label: 'Inventory', icon: 'fa-boxes' },
    { name: 'issuance', label: 'Issuance Records', icon: 'fa-file-alt' },
    { name: 'deliveries', label: 'Deliveries', icon: 'fa-truck' },
    { name: 'reports', label: 'Reports', icon: 'fa-chart-bar' },
    { name: 'history', label: 'History', icon: 'fa-history' },
    { name: 'settings', label: 'Settings', icon: 'fa-cog' }
];

// Initialize function called by main.js
window.init_settings = function() {
    console.log('Initializing Settings page...');
    
    // Auto-detect base path
    const path = window.location.pathname;
    const pathParts = path.split('/').filter(p => p);
    
    let basePath = '';
    if (pathParts.length > 0 && pathParts[0] !== 'pages') {
        basePath = '/' + pathParts[0];
    }
    window.settingsBasePath = basePath;
    
    console.log('Detected base path:', basePath);
    
    // Initialize Bootstrap modals
    const modalElement = document.getElementById('dataModal');
    if (modalElement) {
        window.settingsModalInstance = new bootstrap.Modal(modalElement);
    }
    
    const deleteModalElement = document.getElementById('deleteModal');
    if (deleteModalElement) {
        window.deleteModalInstance = new bootstrap.Modal(deleteModalElement);
    }
    
    const permissionsModalElement = document.getElementById('permissionsModal');
    if (permissionsModalElement) {
        window.permissionsModalInstance = new bootstrap.Modal(permissionsModalElement);
    }
    
    // Initialize data storage
    window.settingsData = {
        roles: [],
        departments: [],
        sites: [],
        status: []
    };
    
    window.currentSettingsSection = 'roles';
    window.editingSettingsId = null;
    window.currentRolePermissions = null;
    
    // Load all data initially
    loadSettingsData('roles');
    loadSettingsData('departments');
};

async function loadSettingsData(section) {
    const tbody = document.getElementById(`${section}TableBody`);
    if (!tbody) {
        console.error(`Table body #${section}TableBody not found`);
        return;
    }
    
    const loadingColspan = section === 'departments' ? '4' : '5';
    tbody.innerHTML = `<tr><td colspan="${loadingColspan}" class="text-center">
        <div class="spinner-border spinner-border-sm text-primary" role="status">
            <span class="visually-hidden">Loading...</span>
        </div>
        <p class="mt-2">Loading ${section}...</p>
    </td></tr>`;

    try {
        let endpoint = '';
        const basePath = window.settingsBasePath || '';
        const controllerPath = `${basePath}/controller/settings.php`;
        
        if (section === 'roles') {
            endpoint = `${controllerPath}?action=getRoles`;
        } else if (section === 'departments') {
            endpoint = `${controllerPath}?action=getDepartments`;
        } else {
            tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted">
                <i class="fas fa-info-circle fa-2x mb-2 d-block"></i>
                ${section} section coming soon...
            </td></tr>`;
            return;
        }

        console.log('Fetching from:', endpoint);
        const response = await fetch(endpoint);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const responseText = await response.text();
        const result = JSON.parse(responseText);

        if (result.success) {
            window.settingsData[section] = result.data;
            renderTableData(section, tbody);
        } else {
            throw new Error(result.message);
        }

    } catch (error) {
        console.error('Error loading data:', error);
        const errorColspan = section === 'departments' ? '4' : '5';
        tbody.innerHTML = `<tr><td colspan="${errorColspan}" class="text-center text-danger">
            <i class="fas fa-exclamation-triangle fa-2x mb-2 d-block"></i>
            Error loading ${section}: ${error.message}
        </td></tr>`;
    }
}

function renderTableData(section, tbody) {
    tbody.innerHTML = '';
    const data = window.settingsData[section] || [];

    if (data.length === 0) {
        const colspan = section === 'departments' ? '4' : '5';
        tbody.innerHTML = `<tr><td colspan="${colspan}" class="text-center text-muted">
            <i class="fas fa-inbox fa-2x mb-2 d-block"></i>
            No ${section} found. Click "Add ${section.slice(0, -1)}" to create one.
        </td></tr>`;
        return;
    }

    data.forEach(item => {
        const row = document.createElement('tr');
        
        if (section === 'roles') {
            const desc = escapeHtml(item.description);
            const shortDesc = desc.length > 50 ? desc.substring(0, 50) + '...' : desc;
            
            row.innerHTML = `
                <td>${item.id}</td>
                <td><strong>${escapeHtml(item.role_name)}</strong></td>
                <td title="${desc}">${shortDesc}</td>
                <td><small class="text-muted">${formatDate(item.created_at)}</small></td>
                <td class="text-nowrap">
                    <button class="btn btn-sm btn-info me-1" onclick="managePermissions(${item.id}, '${escapeHtml(item.role_name)}')" title="Manage Permissions">
                        <i class="fas fa-shield-alt"></i>
                    </button>
                    <button class="btn btn-sm btn-warning me-1" onclick="editSettingsItem('${section}', ${item.id})" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteSettingsItem('${section}', ${item.id})" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
        } else if (section === 'departments') {
            row.innerHTML = `
                <td>${item.id}</td>
                <td><strong>${escapeHtml(item.department_name)}</strong></td>
                <td><small class="text-muted">${formatDate(item.created_at)}</small></td>
                <td class="text-nowrap">
                    <button class="btn btn-sm btn-warning me-1" onclick="editSettingsItem('${section}', ${item.id})" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteSettingsItem('${section}', ${item.id})" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
        }
        
        tbody.appendChild(row);
    });
}

async function managePermissions(roleId, roleName) {
    window.currentRoleId = roleId;
    
    const roleNameEl = document.getElementById('permissionsRoleName');
    if (roleNameEl) {
        roleNameEl.textContent = roleName;
    }
    
    const tbody = document.getElementById('permissionsTableBody');
    if (!tbody) return;
    
    // Show loading
    tbody.innerHTML = `<tr><td colspan="5" class="text-center">
        <div class="spinner-border spinner-border-sm text-primary" role="status">
            <span class="visually-hidden">Loading permissions...</span>
        </div>
    </td></tr>`;
    
    try {
        const basePath = window.settingsBasePath || '';
        const endpoint = `${basePath}/controller/settings.php?action=getRolePermissions&role_id=${roleId}`;
        
        const response = await fetch(endpoint);
        const result = await response.json();
        
        let permissions = {};
        
        if (result.success && result.data) {
            result.data.forEach(perm => {
                permissions[perm.page_name] = {
                    can_view: perm.can_view == 1,
                    can_add: perm.can_add == 1,
                    can_edit: perm.can_edit == 1,
                    can_delete: perm.can_delete == 1
                };
            });
        }
        
        // Render permissions table
        tbody.innerHTML = '';
        AVAILABLE_PAGES.forEach(page => {
            const perm = permissions[page.name] || {
                can_view: false,
                can_add: false,
                can_edit: false,
                can_delete: false
            };
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="permission-page-name">
                    <i class="fas ${page.icon} me-2"></i>${page.label}
                </td>
                <td class="permission-checkbox-cell">
                    <input type="checkbox" 
                           data-page="${page.name}" 
                           data-perm="view" 
                           ${perm.can_view ? 'checked' : ''}
                           onchange="updatePermissionCheckboxes(this)">
                </td>
                <td class="permission-checkbox-cell">
                    <input type="checkbox" 
                           data-page="${page.name}" 
                           data-perm="add" 
                           ${perm.can_add ? 'checked' : ''}>
                </td>
                <td class="permission-checkbox-cell">
                    <input type="checkbox" 
                           data-page="${page.name}" 
                           data-perm="edit" 
                           ${perm.can_edit ? 'checked' : ''}>
                </td>
                <td class="permission-checkbox-cell">
                    <input type="checkbox" 
                           data-page="${page.name}" 
                           data-perm="delete" 
                           ${perm.can_delete ? 'checked' : ''}>
                </td>
            `;
            tbody.appendChild(row);
        });
        
        if (window.permissionsModalInstance) {
            window.permissionsModalInstance.show();
        }
        
    } catch (error) {
        console.error('Error loading permissions:', error);
        tbody.innerHTML = `<tr><td colspan="5" class="text-center text-danger">
            Error loading permissions: ${error.message}
        </td></tr>`;
    }
}

function updatePermissionCheckboxes(viewCheckbox) {
    const page = viewCheckbox.getAttribute('data-page');
    const isChecked = viewCheckbox.checked;
    
    // If view is unchecked, uncheck all other permissions for this page
    if (!isChecked) {
        const allCheckboxes = document.querySelectorAll(`input[data-page="${page}"]`);
        allCheckboxes.forEach(cb => {
            cb.checked = false;
        });
    }
}

async function savePermissions() {
    const tbody = document.getElementById('permissionsTableBody');
    if (!tbody) return;
    
    const permissions = {};
    const checkboxes = tbody.querySelectorAll('input[type="checkbox"]');
    
    checkboxes.forEach(cb => {
        const page = cb.getAttribute('data-page');
        const perm = cb.getAttribute('data-perm');
        
        if (!permissions[page]) {
            permissions[page] = {
                can_view: 0,
                can_add: 0,
                can_edit: 0,
                can_delete: 0
            };
        }
        
        if (perm === 'view') {
            permissions[page].can_view = cb.checked ? 1 : 0;
        } else if (perm === 'add') {
            permissions[page].can_add = cb.checked ? 1 : 0;
        } else if (perm === 'edit') {
            permissions[page].can_edit = cb.checked ? 1 : 0;
        } else if (perm === 'delete') {
            permissions[page].can_delete = cb.checked ? 1 : 0;
        }
    });
    
    try {
        const basePath = window.settingsBasePath || '';
        const endpoint = `${basePath}/controller/settings.php`;
        
        const formData = new FormData();
        formData.append('action', 'saveRolePermissions');
        formData.append('role_id', window.currentRoleId);
        formData.append('permissions', JSON.stringify(permissions));
        
        const response = await fetch(endpoint, {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            showSettingsToast(result.message, 'success');
            if (window.permissionsModalInstance) {
                window.permissionsModalInstance.hide();
            }
        } else {
            showSettingsToast(result.message, 'danger');
        }
        
    } catch (error) {
        console.error('Error saving permissions:', error);
        showSettingsToast('Error saving permissions: ' + error.message, 'danger');
    }
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function showAddSettingsModal(section) {
    window.currentSettingsSection = section;
    window.editingSettingsId = null;
    
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    
    if (!modalTitle || !modalBody) {
        console.error('Modal elements not found');
        return;
    }
    
    let formHtml = '';
    
    if (section === 'roles') {
        modalTitle.textContent = 'Add New Role';
        formHtml = `
            <div class="mb-3">
                <label class="form-label fw-bold">Role Name <span class="text-danger">*</span></label>
                <input type="text" class="form-control" id="role_name" placeholder="e.g., Manager" required>
            </div>
            <div class="mb-3">
                <label class="form-label fw-bold">Description <span class="text-danger">*</span></label>
                <textarea class="form-control" id="description" rows="3" placeholder="Describe the role responsibilities..." required></textarea>
            </div>
        `;
    } else if (section === 'departments') {
        modalTitle.textContent = 'Add New Department';
        formHtml = `
            <div class="mb-3">
                <label class="form-label fw-bold">Department Name <span class="text-danger">*</span></label>
                <input type="text" class="form-control" id="department_name" placeholder="e.g., Human Resources" required>
            </div>
        `;
    } else {
        showSettingsToast('This section is not yet implemented', 'info');
        return;
    }
    
    modalBody.innerHTML = formHtml;
    if (window.settingsModalInstance) {
        window.settingsModalInstance.show();
    }
}

function editSettingsItem(section, id) {
    window.currentSettingsSection = section;
    window.editingSettingsId = id;
    
    const item = window.settingsData[section].find(i => i.id === id);
    if (!item) {
        showSettingsToast('Item not found', 'danger');
        return;
    }
    
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    
    if (!modalTitle || !modalBody) {
        console.error('Modal elements not found');
        return;
    }
    
    let formHtml = '';
    
    if (section === 'roles') {
        modalTitle.textContent = 'Edit Role';
        formHtml = `
            <div class="mb-3">
                <label class="form-label fw-bold">Role Name <span class="text-danger">*</span></label>
                <input type="text" class="form-control" id="role_name" value="${escapeHtml(item.role_name)}" required>
            </div>
            <div class="mb-3">
                <label class="form-label fw-bold">Description <span class="text-danger">*</span></label>
                <textarea class="form-control" id="description" rows="3" required>${escapeHtml(item.description)}</textarea>
            </div>
        `;
    } else if (section === 'departments') {
        modalTitle.textContent = 'Edit Department';
        formHtml = `
            <div class="mb-3">
                <label class="form-label fw-bold">Department Name <span class="text-danger">*</span></label>
                <input type="text" class="form-control" id="department_name" value="${escapeHtml(item.department_name)}" required>
            </div>
        `;
    }
    
    modalBody.innerHTML = formHtml;
    if (window.settingsModalInstance) {
        window.settingsModalInstance.show();
    }
}

async function saveSettingsData() {
    const section = window.currentSettingsSection;
    
    try {
        let formData = new FormData();
        const basePath = window.settingsBasePath || '';
        const endpoint = `${basePath}/controller/settings.php`;
        
        if (section === 'roles') {
            const roleName = document.getElementById('role_name')?.value.trim();
            const description = document.getElementById('description')?.value.trim();
            
            if (!roleName || !description) {
                showSettingsToast('Please fill in all required fields', 'warning');
                return;
            }
            
            formData.append('role_name', roleName);
            formData.append('description', description);
            
            if (window.editingSettingsId) {
                formData.append('action', 'updateRole');
                formData.append('id', window.editingSettingsId);
            } else {
                formData.append('action', 'addRole');
            }
            
        } else if (section === 'departments') {
            const departmentName = document.getElementById('department_name')?.value.trim();
            
            if (!departmentName) {
                showSettingsToast('Please fill in all required fields', 'warning');
                return;
            }
            
            formData.append('department_name', departmentName);
            
            if (window.editingSettingsId) {
                formData.append('action', 'updateDepartment');
                formData.append('id', window.editingSettingsId);
            } else {
                formData.append('action', 'addDepartment');
            }
        }
        
        const response = await fetch(endpoint, {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            showSettingsToast(result.message, 'success');
            if (window.settingsModalInstance) {
                window.settingsModalInstance.hide();
            }
            loadSettingsData(section);
        } else {
            showSettingsToast(result.message, 'danger');
        }
        
    } catch (error) {
        console.error('Error saving data:', error);
        showSettingsToast('Error saving data: ' + error.message, 'danger');
    }
}

async function deleteSettingsItem(section, id) {
    const item = window.settingsData[section].find(i => i.id === id);
    const itemName = section === 'roles' ? item?.role_name : item?.department_name;
    
    if (!item) {
        showSettingsToast('Item not found', 'danger');
        return;
    }
    
    const deleteItemNameEl = document.getElementById('deleteItemName');
    if (deleteItemNameEl) {
        const sectionLabel = section.charAt(0).toUpperCase() + section.slice(0, -1);
        deleteItemNameEl.innerHTML = `<strong>${sectionLabel}:</strong> ${escapeHtml(itemName)}`;
    }
    
    window.pendingDelete = { section, id };
    
    if (window.deleteModalInstance) {
        window.deleteModalInstance.show();
    }
}

async function confirmDelete() {
    if (!window.pendingDelete) return;
    
    const { section, id } = window.pendingDelete;
    
    try {
        let formData = new FormData();
        const basePath = window.settingsBasePath || '';
        const endpoint = `${basePath}/controller/settings.php`;
        
        if (section === 'roles') {
            formData.append('action', 'deleteRole');
            formData.append('id', id);
        } else if (section === 'departments') {
            formData.append('action', 'deleteDepartment');
            formData.append('id', id);
        }
        
        const response = await fetch(endpoint, {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            if (window.deleteModalInstance) {
                window.deleteModalInstance.hide();
            }
            
            showSettingsToast(result.message, 'success');
            loadSettingsData(section);
        } else {
            showSettingsToast(result.message, 'danger');
        }
        
    } catch (error) {
        console.error('Error deleting item:', error);
        showSettingsToast('Error deleting item: ' + error.message, 'danger');
    } finally {
        window.pendingDelete = null;
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', confirmDelete);
    }
});

function escapeHtml(text) {
    if (!text) return '';
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return String(text).replace(/[&<>"']/g, m => map[m]);
}

function showSettingsToast(message, type = 'info') {
    const colors = { 
        success: '#28a745', 
        warning: '#ffc107', 
        info: '#17a2b8', 
        danger: '#dc3545' 
    };
    
    const icons = {
        success: 'fa-check-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle',
        danger: 'fa-times-circle'
    };
    
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${colors[type] || colors.info};
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 9999;
        animation: slideIn 0.3s ease;
        display: flex;
        align-items: center;
        gap: 10px;
        max-width: 400px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;
    
    toast.innerHTML = `
        <i class="fas ${icons[type]} fa-lg"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Make functions globally accessible
window.showAddSettingsModal = showAddSettingsModal;
window.editSettingsItem = editSettingsItem;
window.saveSettingsData = saveSettingsData;
window.deleteSettingsItem = deleteSettingsItem;
window.managePermissions = managePermissions;
window.savePermissions = savePermissions;
window.updatePermissionCheckboxes = updatePermissionCheckboxes;