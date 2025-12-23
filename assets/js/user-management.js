// assets/js/user-management.js - Auto Custom Permissions

window.init_users = function() {
    console.log('Initializing User Management with Auto Custom Permissions...');
    
    // Detect base path
    const path = window.location.pathname;
    const pathParts = path.split('/').filter(p => p);
    let basePath = '';
    if (pathParts.length > 0 && pathParts[0] !== 'pages') {
        basePath = '/' + pathParts[0];
    }
    window.userBasePath = basePath;
    
    // Initialize Add User modal
    const addUserModalElement = document.getElementById('addUserModal');
    if (addUserModalElement) {
        window.addUserModalInstance = new bootstrap.Modal(addUserModalElement);
        
        // Handle form submission
        const addForm = document.getElementById('addUserForm');
        if (addForm) {
            addForm.addEventListener('submit', handleAddUserSubmit);
        }
    }
    
    // Initialize Edit User modal
    const editUserModalElement = document.getElementById('editUserModal');
    if (editUserModalElement) {
        window.editUserModalInstance = new bootstrap.Modal(editUserModalElement);
        
        // Handle form submission
        const editForm = document.getElementById('editUserForm');
        if (editForm) {
            editForm.addEventListener('submit', handleEditUserSubmit);
        }
    }
    
    // Initialize delete modal
    const deleteUserModalElement = document.getElementById('deleteUserModal');
    if (deleteUserModalElement) {
        window.deleteUserModalInstance = new bootstrap.Modal(deleteUserModalElement);
    }
    
    // Initialize permissions modal
    const userPermissionsModalElement = document.getElementById('userPermissionsModal');
    if (userPermissionsModalElement) {
        window.userPermissionsModalInstance = new bootstrap.Modal(userPermissionsModalElement);
    }
    
    // Initialize data
    window.currentUserId = null;
    window.currentUserPermissions = {};
    window.currentDeleteUserId = null;
    
    // Load initial data
    loadUsers();
    loadRolesAndDepartments();
};

// Load users
async function loadUsers() {
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = `<tr><td colspan="8" class="text-center">
        <div class="spinner-border spinner-border-sm text-primary" role="status">
            <span class="visually-hidden">Loading...</span>
        </div>
        <p class="mt-2">Loading users...</p>
    </td></tr>`;
    
    try {
        const basePath = window.userBasePath || '';
        const endpoint = `${basePath}/controller/userController.php?action=fetchUsers`;
        
        const response = await fetch(endpoint);
        const result = await response.json();
        
        if (result.success && result.users) {
            renderUsersTable(result.users, tbody);
        } else {
            throw new Error(result.message || 'Failed to load users');
        }
        
    } catch (error) {
        console.error('Error loading users:', error);
        tbody.innerHTML = `<tr><td colspan="8" class="text-center text-danger">
            <i class="fas fa-exclamation-triangle fa-2x mb-2 d-block"></i>
            Error loading users: ${error.message}
        </td></tr>`;
    }
}

// Render users table
function renderUsersTable(users, tbody) {
    tbody.innerHTML = '';
    
    if (users.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" class="text-center text-muted">
            <i class="fas fa-inbox fa-2x mb-2 d-block"></i>
            No users found
        </td></tr>`;
        return;
    }
    
    users.forEach(user => {
        const row = document.createElement('tr');
        const statusClass = user.status === 'Active' ? 'success' : 'secondary';
        const statusIcon = user.status === 'Active' ? 'check-circle' : 'ban';
        
        row.innerHTML = `
            <td>${user.id}</td>
            <td><strong>${escapeHtml(user.name || user.full_name || '-')}</strong></td>
            <td>${escapeHtml(user.user_id)}</td>
            <td>${escapeHtml(user.email || '-')}</td>
            <td>
                <span class="badge bg-primary">${escapeHtml(user.role_name || 'N/A')}</span>
            </td>
            <td class="text-center">
                <span class="badge bg-${statusClass}">
                    <i class="fas fa-${statusIcon} me-1"></i>${escapeHtml(user.status)}
                </span>
            </td>
            <td class="text-center">
                <button class="btn btn-sm btn-info" 
                        onclick="manageUserPermissions(${user.id}, '${escapeHtml(user.name || user.full_name || user.user_id)}', '${escapeHtml(user.role_name)}')" 
                        title="Manage Custom Permissions">
                    <i class="fas fa-user-shield"></i>
                </button>
            </td>
            <td class="text-center text-nowrap">
                <button class="btn btn-sm btn-${user.status === 'Active' ? 'success' : 'secondary'}" 
                        onclick="toggleUserStatus(${user.id}, '${escapeHtml(user.status)}')" 
                        title="Toggle Status">
                    <i class="fas fa-power-off"></i>
                </button>
                <button class="btn btn-sm btn-warning me-1" 
                        onclick="editUser(${user.id})" 
                        title="Edit User">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-danger" 
                        onclick="deleteUser(${user.id}, '${escapeHtml(user.name || user.full_name || user.user_id)}')" 
                        title="Delete User">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Load roles and departments for dropdowns
async function loadRolesAndDepartments() {
    try {
        const basePath = window.userBasePath || '';
        
        // Load roles from userController.php
        const rolesResponse = await fetch(`${basePath}/controller/userController.php?action=getRoles`);
        const rolesResult = await rolesResponse.json();
        
        if (rolesResult.success && rolesResult.roles) {
            populateRoleDropdown('addRoleId', rolesResult.roles);
            populateRoleDropdown('editRoleId', rolesResult.roles);
        } else {
            console.error('Failed to load roles:', rolesResult.message);
            showToast('Failed to load roles: ' + (rolesResult.message || 'Unknown error'), 'danger');
        }
        
        // Load departments from userController.php
        const deptsResponse = await fetch(`${basePath}/controller/userController.php?action=getDepartments`);
        const deptsResult = await deptsResponse.json();
        
        if (deptsResult.success && deptsResult.departments) {
            populateDepartmentDropdown('addDepartmentId', deptsResult.departments);
            populateDepartmentDropdown('editDepartmentId', deptsResult.departments);
        } else {
            console.error('Failed to load departments:', deptsResult.message);
            showToast('Failed to load departments: ' + (deptsResult.message || 'Unknown error'), 'danger');
        }
    } catch (error) {
        console.error('Error loading roles/departments:', error);
        showToast('Error loading roles/departments: ' + error.message, 'danger');
    }
}

// Helper function to populate role dropdown
function populateRoleDropdown(selectId, roles) {
    const roleSelect = document.getElementById(selectId);
    if (roleSelect) {
        const defaultOption = '<option value="">Select Role</option>';
        const roleOptions = roles.map(role => 
            `<option value="${role.id}">${escapeHtml(role.role_name)}</option>`
        ).join('');
        roleSelect.innerHTML = defaultOption + roleOptions;
    }
}

// Helper function to populate department dropdown
function populateDepartmentDropdown(selectId, departments) {
    const deptSelect = document.getElementById(selectId);
    if (deptSelect) {
        const defaultOption = '<option value="">Select Department</option>';
        const deptOptions = departments.map(dept => 
            `<option value="${dept.id}">${escapeHtml(dept.department_name)}</option>`
        ).join('');
        deptSelect.innerHTML = defaultOption + deptOptions;
    }
}

// Show add user modal
async function showAddUserModal() {
    const form = document.getElementById('addUserForm');
    if (form) {
        form.reset();
    }
    
    await loadRolesAndDepartments();
    
    if (window.addUserModalInstance) {
        window.addUserModalInstance.show();
    }
}

// Handle add user form submission
async function handleAddUserSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    formData.append('action', 'createUser');
    
    try {
        const basePath = window.userBasePath || '';
        const response = await fetch(`${basePath}/controller/userController.php`, {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            showToast(result.message, 'success');
            if (window.addUserModalInstance) {
                window.addUserModalInstance.hide();
            }
            e.target.reset();
            loadUsers();
        } else {
            showToast(result.message, 'danger');
        }
    } catch (error) {
        console.error('Error creating user:', error);
        showToast('Error creating user: ' + error.message, 'danger');
    }
}

// Edit user
async function editUser(userId) {
    try {
        await loadRolesAndDepartments();
        
        const basePath = window.userBasePath || '';
        const response = await fetch(`${basePath}/controller/userController.php?action=getUserById&id=${userId}`);
        const result = await response.json();
        
        if (result.success && result.user) {
            const user = result.user;
            
            document.getElementById('editUserId').value = user.id;
            document.getElementById('editFirstName').value = user.first_name;
            document.getElementById('editLastName').value = user.last_name;
            document.getElementById('editUsername').value = user.user_id;
            document.getElementById('editEmail').value = user.email;
            document.getElementById('editStatus').value = user.status;
            
            setTimeout(() => {
                document.getElementById('editRoleId').value = user.role_id;
                document.getElementById('editDepartmentId').value = user.department_id;
            }, 100);
            
            if (window.editUserModalInstance) {
                window.editUserModalInstance.show();
            }
        } else {
            showToast(result.message || 'Failed to load user', 'danger');
        }
    } catch (error) {
        console.error('Error loading user:', error);
        showToast('Error loading user: ' + error.message, 'danger');
    }
}

async function handleEditUserSubmit(e) {
    e.preventDefault();
    
    // Show confirmation modal
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.id = 'confirmEditModal';
    modal.innerHTML = `
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content border-warning">
                <div class="modal-header bg-warning text-dark">
                    <h5 class="modal-title">
                        <i class="fas fa-exclamation-triangle me-2"></i>
                        Confirm Changes
                    </h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <div class="text-center mb-4">
                        <i class="fas fa-user-edit fa-4x text-warning mb-3"></i>
                        <h5 class="mb-3">Save User Changes?</h5>
                    </div>
                    
                    <div class="alert alert-info">
                        <div class="d-flex align-items-start">
                            <i class="fas fa-info-circle fa-lg me-3 mt-1"></i>
                            <div>
                                <strong>You are about to update:</strong>
                                <ul class="mb-0 mt-2">
                                    <li>User information</li>
                                    <li>Role assignment</li>
                                    <li>Department assignment</li>
                                    <li>Account status</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                    
                    <div class="alert alert-warning mb-0">
                        <strong><i class="fas fa-exclamation-circle me-2"></i>Important:</strong>
                        <p class="mb-0 mt-2">If the user's role is changed, their permissions will be reset to the new role's defaults.</p>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                        <i class="fas fa-times me-1"></i> Cancel
                    </button>
                    <button type="button" class="btn btn-warning" id="confirmEditBtn">
                        <i class="fas fa-save me-1"></i> Yes, Save Changes
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    const bsModal = new bootstrap.Modal(modal);
    bsModal.show();
    
    // Handle confirmation
    document.getElementById('confirmEditBtn').addEventListener('click', async function() {
        this.disabled = true;
        this.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Saving...';
        
        const formData = new FormData(e.target);
        formData.append('action', 'updateUser');
        
        try {
            const basePath = window.userBasePath || '';
            const response = await fetch(`${basePath}/controller/userController.php`, {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            
            if (result.success) {
                showToast(result.message, 'success');
                bsModal.hide();
                if (window.editUserModalInstance) {
                    window.editUserModalInstance.hide();
                }
                loadUsers();
            } else {
                showToast(result.message, 'danger');
                this.disabled = false;
                this.innerHTML = '<i class="fas fa-save me-1"></i> Yes, Save Changes';
            }
        } catch (error) {
            console.error('Error updating user:', error);
            showToast('Error updating user: ' + error.message, 'danger');
            this.disabled = false;
            this.innerHTML = '<i class="fas fa-save me-1"></i> Yes, Save Changes';
        }
    });
    
    modal.addEventListener('hidden.bs.modal', () => modal.remove());
}

// Toggle user status
async function toggleUserStatus(userId, currentStatus) {
    const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
    const statusColor = newStatus === 'Active' ? 'success' : 'secondary';
    const statusIcon = newStatus === 'Active' ? 'check-circle' : 'ban';
    
    // Create confirmation modal
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.id = 'confirmToggleStatusModal';
    modal.innerHTML = `
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content border-${statusColor}">
                <div class="modal-header bg-${statusColor} text-white">
                    <h5 class="modal-title">
                        <i class="fas fa-power-off me-2"></i>
                        Confirm Status Change
                    </h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <div class="text-center mb-4">
                        <i class="fas fa-${statusIcon} fa-4x text-${statusColor} mb-3"></i>
                        <h5 class="mb-3">Change User Status to ${newStatus}?</h5>
                    </div>
                    
                    <div class="alert alert-${statusColor === 'success' ? 'success' : 'warning'}">
                        <div class="d-flex align-items-start">
                            <i class="fas fa-info-circle fa-lg me-3 mt-1"></i>
                            <div>
                                ${newStatus === 'Active' ? `
                                    <strong>Activating this user will:</strong>
                                    <ul class="mb-0 mt-2">
                                        <li>Allow them to log in to the system</li>
                                        <li>Restore their access permissions</li>
                                        <li>Enable all account features</li>
                                    </ul>
                                ` : `
                                    <strong>Deactivating this user will:</strong>
                                    <ul class="mb-0 mt-2">
                                        <li>Prevent them from logging in</li>
                                        <li>Suspend all account access</li>
                                        <li>Keep their data intact for reactivation</li>
                                    </ul>
                                `}
                            </div>
                        </div>
                    </div>
                    
                    ${newStatus === 'Inactive' ? `
                    <div class="alert alert-danger mb-0">
                        <strong><i class="fas fa-exclamation-triangle me-2"></i>Warning:</strong>
                        <p class="mb-0 mt-2">The user will be logged out immediately and cannot access the system until reactivated.</p>
                    </div>
                    ` : ''}
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                        <i class="fas fa-times me-1"></i> Cancel
                    </button>
                    <button type="button" class="btn btn-${statusColor}" id="confirmToggleBtn">
                        <i class="fas fa-${statusIcon} me-1"></i> Yes, Change to ${newStatus}
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    const bsModal = new bootstrap.Modal(modal);
    bsModal.show();
    
    // Handle confirmation
    document.getElementById('confirmToggleBtn').addEventListener('click', async function() {
        this.disabled = true;
        this.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Updating...';
        
        try {
            const basePath = window.userBasePath || '';
            const formData = new FormData();
            formData.append('action', 'toggleStatus');
            formData.append('id', userId);
            formData.append('status', newStatus);
            
            const response = await fetch(`${basePath}/controller/userController.php`, {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            
            if (result.success) {
                showToast(result.message, 'success');
                bsModal.hide();
                loadUsers();
            } else {
                showToast(result.message, 'danger');
                this.disabled = false;
                this.innerHTML = `<i class="fas fa-${statusIcon} me-1"></i> Yes, Change to ${newStatus}`;
            }
        } catch (error) {
            console.error('Error toggling status:', error);
            showToast('Error toggling status: ' + error.message, 'danger');
            this.disabled = false;
            this.innerHTML = `<i class="fas fa-${statusIcon} me-1"></i> Yes, Change to ${newStatus}`;
        }
    });
    
    modal.addEventListener('hidden.bs.modal', () => modal.remove());
}

// Delete user - show modal
async function deleteUser(userId, userName) {
    try {
        const basePath = window.userBasePath || '';
        const response = await fetch(`${basePath}/controller/userController.php?action=getUserById&id=${userId}`);
        const result = await response.json();
        
        if (result.success && result.user) {
            const user = result.user;
            
            window.currentDeleteUserId = userId;
            
            document.getElementById('deleteUserName').textContent = user.first_name + ' ' + user.last_name;
            document.getElementById('deleteUserEmail').textContent = user.email;
            
            if (window.deleteUserModalInstance) {
                window.deleteUserModalInstance.show();
            }
        } else {
            showToast('Failed to load user information', 'danger');
        }
    } catch (error) {
        console.error('Error loading user for deletion:', error);
        showToast('Error: ' + error.message, 'danger');
    }
}

// Confirm delete user
async function confirmDeleteUser() {
    if (!window.currentDeleteUserId) {
        showToast('No user selected for deletion', 'danger');
        return;
    }
    
    try {
        const basePath = window.userBasePath || '';
        const formData = new FormData();
        formData.append('action', 'deleteUser');
        formData.append('id', window.currentDeleteUserId);
        
        const response = await fetch(`${basePath}/controller/userController.php`, {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            showToast(result.message, 'success');
            if (window.deleteUserModalInstance) {
                window.deleteUserModalInstance.hide();
            }
            window.currentDeleteUserId = null;
            loadUsers();
        } else {
            showToast(result.message, 'danger');
        }
    } catch (error) {
        console.error('Error deleting user:', error);
        showToast('Error deleting user: ' + error.message, 'danger');
    }
}

// Manage user permissions (AUTO CUSTOM - No toggle needed)
async function manageUserPermissions(userId, userName, roleName) {
    window.currentUserId = userId;
    
    const userNameEl = document.getElementById('userPermissionsName');
    const userRoleEl = document.getElementById('userPermissionsRole');
    
    if (userNameEl) userNameEl.textContent = userName;
    if (userRoleEl) userRoleEl.textContent = roleName;
    
    const tbody = document.getElementById('userPermissionsTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = `<tr><td colspan="6" class="text-center">
        <div class="spinner-border spinner-border-sm text-primary" role="status">
            <span class="visually-hidden">Loading permissions...</span>
        </div>
    </td></tr>`;
    
    try {
        const basePath = window.userBasePath || '';
        const endpoint = `${basePath}/controller/userController.php?action=getUserPermissions&user_id=${userId}`;
        
        const response = await fetch(endpoint);
        const result = await response.json();
        
        if (result.success && result.data) {
            renderUserPermissionsTable(result.data.permissions, tbody);
            if (window.userPermissionsModalInstance) {
                window.userPermissionsModalInstance.show();
            }
        } else {
            throw new Error(result.message || 'Failed to load permissions');
        }
        
    } catch (error) {
        console.error('Error loading user permissions:', error);
        tbody.innerHTML = `<tr><td colspan="6" class="text-center text-danger">
            Error loading permissions: ${error.message}
        </td></tr>`;
    }
}

// Render user permissions table (NO USE CUSTOM TOGGLE - Direct editing)
function renderUserPermissionsTable(permissions, tbody) {
    tbody.innerHTML = '';
    
    permissions.forEach(perm => {
        const pageInfo = AVAILABLE_PAGES.find(p => p.name === perm.page_name) || 
                        { name: perm.page_name, label: perm.page_name, icon: 'fa-file' };
        
        const roleDefaultBadges = [
            perm.role_default.can_view == 1 ? '<span class="badge bg-info badge-permission">View</span>' : '',
            perm.role_default.can_add == 1 ? '<span class="badge bg-success badge-permission">Add</span>' : '',
            perm.role_default.can_edit == 1 ? '<span class="badge bg-warning badge-permission">Edit</span>' : '',
            perm.role_default.can_delete == 1 ? '<span class="badge bg-danger badge-permission">Del</span>' : ''
        ].filter(b => b).join(' ') || '<span class="text-muted">None</span>';
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="permission-page-name">
                <i class="fas ${pageInfo.icon} me-2"></i>${pageInfo.label}
            </td>
            <td class="permission-checkbox-cell text-center">
                <input type="checkbox" 
                       class="form-check-input permission-checkbox"
                       data-page="${perm.page_name}" 
                       data-perm="view"
                       ${perm.can_view == 1 ? 'checked' : ''}
                       onchange="updateUserPermissionCheckbox(this)">
            </td>
            <td class="permission-checkbox-cell text-center">
                <input type="checkbox" 
                       class="form-check-input permission-checkbox"
                       data-page="${perm.page_name}" 
                       data-perm="add"
                       ${perm.can_add == 1 ? 'checked' : ''}>
            </td>
            <td class="permission-checkbox-cell text-center">
                <input type="checkbox" 
                       class="form-check-input permission-checkbox"
                       data-page="${perm.page_name}" 
                       data-perm="edit"
                       ${perm.can_edit == 1 ? 'checked' : ''}>
            </td>
            <td class="permission-checkbox-cell text-center">
                <input type="checkbox" 
                       class="form-check-input permission-checkbox"
                       data-page="${perm.page_name}" 
                       data-perm="delete"
                       ${perm.can_delete == 1 ? 'checked' : ''}>
            </td>
            <td>
                ${roleDefaultBadges}
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Update user permission checkbox (view uncheck = uncheck all)
function updateUserPermissionCheckbox(viewCheckbox) {
    const page = viewCheckbox.getAttribute('data-page');
    const isChecked = viewCheckbox.checked;
    
    if (!isChecked) {
        const row = viewCheckbox.closest('tr');
        const allCheckboxes = row.querySelectorAll(`input[data-page="${page}"]`);
        allCheckboxes.forEach(cb => {
            cb.checked = false;
        });
    }
}

// Save user custom permissions (ALWAYS USE_CUSTOM = 1)
async function saveUserCustomPermissions() {
    const tbody = document.getElementById('userPermissionsTableBody');
    if (!tbody || !window.currentUserId) return;
    
    const permissions = {};
    const rows = tbody.querySelectorAll('tr');
    
    rows.forEach(row => {
        const viewCheckbox = row.querySelector('input[data-perm="view"]');
        if (!viewCheckbox) return;
        
        const page = viewCheckbox.getAttribute('data-page');
        const addCheckbox = row.querySelector('input[data-perm="add"]');
        const editCheckbox = row.querySelector('input[data-perm="edit"]');
        const deleteCheckbox = row.querySelector('input[data-perm="delete"]');
        
        permissions[page] = {
            use_custom: 1,
            can_view: viewCheckbox.checked === true ? 1 : 0,
            can_add: addCheckbox.checked === true ? 1 : 0,
            can_edit: editCheckbox.checked === true ? 1 : 0,
            can_delete: deleteCheckbox.checked === true ? 1 : 0
        };
    });
    
    // Count how many permissions are granted
    let totalPermissions = 0;
    Object.values(permissions).forEach(perm => {
        if (perm.can_view) totalPermissions++;
        if (perm.can_add) totalPermissions++;
        if (perm.can_edit) totalPermissions++;
        if (perm.can_delete) totalPermissions++;
    });
    
    // Show confirmation modal
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.id = 'confirmSavePermissionsModal';
    modal.innerHTML = `
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content border-primary">
                <div class="modal-header bg-primary text-white">
                    <h5 class="modal-title">
                        <i class="fas fa-shield-alt me-2"></i>
                        Confirm Permission Changes
                    </h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <div class="text-center mb-4">
                        <i class="fas fa-user-shield fa-4x text-primary mb-3"></i>
                        <h5 class="mb-3">Save Custom Permissions?</h5>
                    </div>
                    
                    <div class="alert alert-info">
                        <div class="d-flex align-items-start">
                            <i class="fas fa-info-circle fa-lg me-3 mt-1"></i>
                            <div>
                                <strong>Permission Summary:</strong>
                                <ul class="mb-0 mt-2">
                                    <li>Total permissions granted: <strong>${totalPermissions}</strong></li>
                                    <li>Pages configured: <strong>${Object.keys(permissions).length}</strong></li>
                                    <li>All permissions are custom</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                    
                    <div class="alert alert-warning mb-0">
                        <strong><i class="fas fa-exclamation-circle me-2"></i>Important:</strong>
                        <p class="mb-0 mt-2">These custom permissions will override the user's role defaults. The user will need to log out and log back in for changes to take effect.</p>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                        <i class="fas fa-times me-1"></i> Cancel
                    </button>
                    <button type="button" class="btn btn-primary" id="confirmSavePermissionsBtn">
                        <i class="fas fa-save me-1"></i> Yes, Save Permissions
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    const bsModal = new bootstrap.Modal(modal);
    bsModal.show();
    
    // Handle confirmation
    document.getElementById('confirmSavePermissionsBtn').addEventListener('click', async function() {
        this.disabled = true;
        this.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Saving...';
        
        console.log('Saving permissions:', JSON.stringify(permissions, null, 2));
        
        try {
            const basePath = window.userBasePath || '';
            const endpoint = `${basePath}/controller/userController.php`;
            
            const formData = new FormData();
            formData.append('action', 'saveUserPermissions');
            formData.append('user_id', window.currentUserId);
            formData.append('permissions', JSON.stringify(permissions));
            
            const response = await fetch(endpoint, {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            
            if (result.success) {
                showToast(result.message + ' User must re-login for changes to apply.', 'success');
                bsModal.hide();
                if (window.userPermissionsModalInstance) {
                    window.userPermissionsModalInstance.hide();
                }
            } else {
                showToast(result.message, 'danger');
                this.disabled = false;
                this.innerHTML = '<i class="fas fa-save me-1"></i> Yes, Save Permissions';
            }
        } catch (error) {
            console.error('Error saving permissions:', error);
            showToast('Error saving permissions: ' + error.message, 'danger');
            this.disabled = false;
            this.innerHTML = '<i class="fas fa-save me-1"></i> Yes, Save Permissions';
        }
    });
    
    modal.addEventListener('hidden.bs.modal', () => modal.remove());
}

// Reset user permissions to role
async function resetUserPermissionsToRole() {
    if (!window.currentUserId) return;
    
    if (!confirm('Are you sure you want to reset this user\'s permissions to their role defaults? All custom permissions will be removed.')) {
        return;
    }
    
    try {
        const basePath = window.userBasePath || '';
        const endpoint = `${basePath}/controller/userController.php`;
        
        const formData = new FormData();
        formData.append('action', 'resetUserPermissions');
        formData.append('user_id', window.currentUserId);
        
        const response = await fetch(endpoint, {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            showToast(result.message, 'success');
            const userNameEl = document.getElementById('userPermissionsName');
            const userRoleEl = document.getElementById('userPermissionsRole');
            manageUserPermissions(window.currentUserId, userNameEl?.textContent || '', userRoleEl?.textContent || '');
        } else {
            showToast(result.message, 'danger');
        }
        
    } catch (error) {
        console.error('Error resetting permissions:', error);
        showToast('Error resetting permissions: ' + error.message, 'danger');
    }
}

// Utility functions
function escapeHtml(text) {
    if (!text) return '';
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return String(text).replace(/[&<>"']/g, m => map[m]);
}

function showToast(message, type = 'info') {
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
window.loadUsers = loadUsers;
window.showAddUserModal = showAddUserModal;
window.editUser = editUser;
window.deleteUser = deleteUser;
window.confirmDeleteUser = confirmDeleteUser;
window.toggleUserStatus = toggleUserStatus;
window.manageUserPermissions = manageUserPermissions;
window.saveUserCustomPermissions = saveUserCustomPermissions;
window.resetUserPermissionsToRole = resetUserPermissionsToRole;
window.updateUserPermissionCheckbox = updateUserPermissionCheckbox;