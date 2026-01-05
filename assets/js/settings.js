// assets/js/settings.js

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
        issuance_types: []
    };
    
    window.currentSettingsSection = 'roles';
    window.editingSettingsId = null;
    window.currentRoleId = null;
    
    // Load all data initially
    loadSettingsData('roles');
    loadSettingsData('departments');
    loadSettingsData('sites');
    loadSettingsData('issuance_types');
};

async function loadSettingsData(section) {
    const tbody = document.getElementById(`${section}TableBody`);
    if (!tbody) {
        console.error(`Table body #${section}TableBody not found`);
        return;
    }
    
    const loadingColspan = section === 'departments' ? '4' : section === 'sites' ? '6' : section === 'issuance_types' ? '5' : '5';
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
        } else if (section === 'sites') {
            endpoint = `${controllerPath}?action=getSites`;
        } else if (section === 'issuance_types') {
            endpoint = `${controllerPath}?action=getIssuanceTypes`;
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
        const errorColspan = section === 'departments' ? '4' : section === 'sites' ? '6' : section === 'issuance_types' ? '5' : '5';
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
        const colspan = section === 'departments' ? '4' : section === 'sites' ? '6' : section === 'issuance_types' ? '5' : '5';
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
                <td class="text-center text-nowrap">
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
                <td class="text-center text-nowrap">
                    <button class="btn btn-sm btn-warning me-1" onclick="editSettingsItem('${section}', ${item.id})" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteSettingsItem('${section}', ${item.id})" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
        } else if (section === 'sites') {
            row.innerHTML = `
                <td>${item.id}</td>
                <td><strong>${escapeHtml(item.site_name)}</strong></td>
                <td>${escapeHtml(item.location)}</td>
                <td class="text-center">
                    <div class="form-check form-switch d-inline-block">
                        <input class="form-check-input" type="checkbox" 
                               ${item.is_active == 1 ? 'checked' : ''} 
                               onchange="toggleSiteStatus(${item.id})"
                               style="cursor: pointer;">
                    </div>
                </td>
                <td><small class="text-muted">${formatDate(item.created_at)}</small></td>
                <td class="text-center text-nowrap">
                    <button class="btn btn-sm btn-warning me-1" onclick="editSettingsItem('${section}', ${item.id})" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteSettingsItem('${section}', ${item.id})" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
        } else if (section === 'issuance_types') {
            const desc = escapeHtml(item.description);
            const shortDesc = desc.length > 50 ? desc.substring(0, 50) + '...' : desc;
            
            row.innerHTML = `
                <td>${item.id}</td>
                <td><strong>${escapeHtml(item.type_name)}</strong></td>
                <td title="${desc}">${shortDesc}</td>
                <td><small class="text-muted">${formatDate(item.created_at)}</small></td>
                <td class="text-center text-nowrap">
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

// ==================== TOGGLE SITE STATUS ====================

async function toggleSiteStatus(id) {
    try {
        const basePath = window.settingsBasePath || '';
        const endpoint = `${basePath}/controller/settings.php`;
        
        const formData = new FormData();
        formData.append('action', 'toggleSiteStatus');
        formData.append('id', id);
        
        const response = await fetch(endpoint, {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            showSettingsToast(result.message, 'success');
            loadSettingsData('sites');
        } else {
            showSettingsToast(result.message, 'danger');
            loadSettingsData('sites'); // Reload to reset toggle
        }
        
    } catch (error) {
        console.error('Error toggling status:', error);
        showSettingsToast('Error toggling status: ' + error.message, 'danger');
        loadSettingsData('sites');
    }
}

// ==================== PERMISSIONS MANAGEMENT ====================

async function managePermissions(roleId, roleName) {
    window.currentRoleId = roleId;
    
    const roleNameEl = document.getElementById('permissionsRoleName');
    if (roleNameEl) {
        roleNameEl.textContent = roleName;
    }
    
    const tbody = document.getElementById('permissionsTableBody');
    if (!tbody) return;
    
    // Show loading
    tbody.innerHTML = `<tr><td colspan="5" class="text-center py-3">
        <div class="spinner-border spinner-border-sm text-primary" role="status">
            <span class="visually-hidden">Loading permissions...</span>
        </div>
        <p class="mt-2 mb-0">Loading permissions...</p>
    </td></tr>`;
    
    try {
        const basePath = window.settingsBasePath || '';
        const endpoint = `${basePath}/controller/settings.php?action=getRolePermissions&role_id=${roleId}`;
        
        console.log('Fetching permissions from:', endpoint);
        const response = await fetch(endpoint);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const responseText = await response.text();
        console.log('Permissions response:', responseText);
        const result = JSON.parse(responseText);
        
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
                    <i class="fas ${page.icon} me-2 text-primary"></i>${page.label}
                </td>
                <td class="permission-checkbox-cell">
                    <input type="checkbox" 
                           class="form-check-input"
                           data-page="${page.name}" 
                           data-perm="view" 
                           ${perm.can_view ? 'checked' : ''}
                           onchange="updatePermissionCheckboxes(this)">
                </td>
                <td class="permission-checkbox-cell">
                    <input type="checkbox" 
                           class="form-check-input"
                           data-page="${page.name}" 
                           data-perm="add" 
                           ${perm.can_add ? 'checked' : ''}>
                </td>
                <td class="permission-checkbox-cell">
                    <input type="checkbox" 
                           class="form-check-input"
                           data-page="${page.name}" 
                           data-perm="edit" 
                           ${perm.can_edit ? 'checked' : ''}>
                </td>
                <td class="permission-checkbox-cell">
                    <input type="checkbox" 
                           class="form-check-input"
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
        tbody.innerHTML = `<tr><td colspan="5" class="text-center text-danger py-3">
            <i class="fas fa-exclamation-triangle fa-2x mb-2 d-block"></i>
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
        
        console.log('Saving permissions for role:', window.currentRoleId);
        const response = await fetch(endpoint, {
            method: 'POST',
            body: formData
        });
        
        const responseText = await response.text();
        console.log('Save response:', responseText);
        const result = JSON.parse(responseText);
        
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

// ==================== ROLE/DEPARTMENT/SITE/ISSUANCE TYPE CRUD ====================

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
    } else if (section === 'sites') {
        modalTitle.textContent = 'Add New Site';
        formHtml = `
            <div class="mb-3">
                <label class="form-label fw-bold">Site Name <span class="text-danger">*</span></label>
                <input type="text" class="form-control" id="site_name" placeholder="e.g., Main Office" required>
            </div>
            <div class="mb-3">
                <label class="form-label fw-bold">Location <span class="text-danger">*</span></label>
                <input type="text" class="form-control" id="location" placeholder="e.g., Manila" required>
            </div>
            <div class="mb-3">
                <div class="form-check form-switch">
                    <input class="form-check-input" type="checkbox" id="is_active" checked>
                    <label class="form-check-label fw-bold" for="is_active">Active</label>
                </div>
            </div>
        `;
    } else if (section === 'issuance_types') {
        modalTitle.textContent = 'Add New Issuance Type';
        formHtml = `
            <div class="mb-3">
                <label class="form-label fw-bold">Type Name <span class="text-danger">*</span></label>
                <input type="text" class="form-control" id="type_name" placeholder="e.g., New Hire" required>
            </div>
            <div class="mb-3">
                <label class="form-label fw-bold">Description <span class="text-danger">*</span></label>
                <textarea class="form-control" id="description" rows="3" placeholder="Describe the issuance type..." required></textarea>
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
    } else if (section === 'sites') {
        modalTitle.textContent = 'Edit Site';
        formHtml = `
            <div class="mb-3">
                <label class="form-label fw-bold">Site Name <span class="text-danger">*</span></label>
                <input type="text" class="form-control" id="site_name" value="${escapeHtml(item.site_name)}" required>
            </div>
            <div class="mb-3">
                <label class="form-label fw-bold">Location <span class="text-danger">*</span></label>
                <input type="text" class="form-control" id="location" value="${escapeHtml(item.location)}" required>
            </div>
            <div class="mb-3">
                <div class="form-check form-switch">
                    <input class="form-check-input" type="checkbox" id="is_active" ${item.is_active == 1 ? 'checked' : ''}>
                    <label class="form-check-label fw-bold" for="is_active">Active</label>
                </div>
            </div>
        `;
    } else if (section === 'issuance_types') {
        modalTitle.textContent = 'Edit Issuance Type';
        formHtml = `
            <div class="mb-3">
                <label class="form-label fw-bold">Type Name <span class="text-danger">*</span></label>
                <input type="text" class="form-control" id="type_name" value="${escapeHtml(item.type_name)}" required>
            </div>
            <div class="mb-3">
                <label class="form-label fw-bold">Description <span class="text-danger">*</span></label>
                <textarea class="form-control" id="description" rows="3" required>${escapeHtml(item.description)}</textarea>
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
        } else if (section === 'sites') {
            const siteName = document.getElementById('site_name')?.value.trim();
            const location = document.getElementById('location')?.value.trim();
            const isActive = document.getElementById('is_active')?.checked ? 1 : 0;
            
            if (!siteName || !location) {
                showSettingsToast('Please fill in all required fields', 'warning');
                return;
            }
            
            formData.append('site_name', siteName);
            formData.append('location', location);
            formData.append('is_active', isActive);
            
            if (window.editingSettingsId) {
                formData.append('action', 'updateSite');
                formData.append('id', window.editingSettingsId);
            } else {
                formData.append('action', 'addSite');
            }
        } else if (section === 'issuance_types') {
            const typeName = document.getElementById('type_name')?.value.trim();
            const description = document.getElementById('description')?.value.trim();
            
            if (!typeName || !description) {
                showSettingsToast('Please fill in all required fields', 'warning');
                return;
            }
            
            formData.append('type_name', typeName);
            formData.append('description', description);
            
            if (window.editingSettingsId) {
                formData.append('action', 'updateIssuanceType');
                formData.append('id', window.editingSettingsId);
            } else {
                formData.append('action', 'addIssuanceType');
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
    let itemName = '';
    
    if (section === 'roles') {
        itemName = item?.role_name;
    } else if (section === 'departments') {
        itemName = item?.department_name;
    } else if (section === 'sites') {
        itemName = item?.site_name;
    } else if (section === 'issuance_types') {
        itemName = item?.type_name;
    }
    
    if (!item) {
        showSettingsToast('Item not found', 'danger');
        return;
    }
    
    const deleteItemNameEl = document.getElementById('deleteItemName');
    if (deleteItemNameEl) {
        const sectionLabel = section === 'issuance_types' ? 'Issuance Type' : section.charAt(0).toUpperCase() + section.slice(0, -1);
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
        } else if (section === 'sites') {
            formData.append('action', 'deleteSite');
            formData.append('id', id);
        } else if (section === 'issuance_types') {
            formData.append('action', 'deleteIssuanceType');
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

// ==================== UTILITY FUNCTIONS ====================

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

const LOGO_STORAGE_KEY = 'system_logo';

function previewLogo(input) {
    if (!input.files || !input.files[0]) return;

    const file = input.files[0];

    // Optional size limit (2MB)
    if (file.size > 2 * 1024 * 1024) {
        alert('Logo must be less than 2MB');
        input.value = '';
        return;
    }

    const reader = new FileReader();
    reader.onload = e => {
        document.getElementById('logoPreview').src = e.target.result;
    };
    reader.readAsDataURL(file);
}

function saveLogo() {
    const img = document.getElementById('logoPreview');
    if (!img || img.src.includes('placeholder.com')) {
        alert('Please select a logo first');
        return;
    }

    localStorage.setItem(LOGO_STORAGE_KEY, img.src);
    alert('Logo saved successfully!');
}

function removeLogo() {
    localStorage.removeItem(LOGO_STORAGE_KEY);
    document.getElementById('logoPreview').src =
        'https://via.placeholder.com/180x80?text=No+Logo';
    alert('Logo removed');
}

// Load saved logo on page load
document.addEventListener('DOMContentLoaded', () => {
    const savedLogo = localStorage.getItem(LOGO_STORAGE_KEY);
    if (savedLogo) {
        document.getElementById('logoPreview').src = savedLogo;
    }
});

// Make functions globally accessible
window.showAddSettingsModal = showAddSettingsModal;
window.editSettingsItem = editSettingsItem;
window.saveSettingsData = saveSettingsData;
window.deleteSettingsItem = deleteSettingsItem;
window.managePermissions = managePermissions;
window.savePermissions = savePermissions;
window.updatePermissionCheckboxes = updatePermissionCheckboxes;
window.toggleSiteStatus = toggleSiteStatus;