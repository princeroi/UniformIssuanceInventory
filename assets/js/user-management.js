// Enhanced Notification System
const NotificationUI = {
    // Show toast notification
    showToast(message, type = 'info') {
        const toastContainer = this.getToastContainer();
        const toast = document.createElement('div');
        toast.className = `toast align-items-center text-white bg-${type} border-0`;
        toast.setAttribute('role', 'alert');
        toast.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">
                    <i class="fas fa-${this.getIcon(type)} me-2"></i>
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        `;
        
        toastContainer.appendChild(toast);
        const bsToast = new bootstrap.Toast(toast, { delay: 4000 });
        bsToast.show();
        
        toast.addEventListener('hidden.bs.toast', () => toast.remove());
    },
    
    // Show confirmation modal
    showConfirm(options) {
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.className = 'modal fade';
            modal.innerHTML = `
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header bg-${options.type || 'warning'} text-white">
                            <h5 class="modal-title">
                                <i class="fas fa-${this.getIcon(options.type || 'warning')} me-2"></i>
                                ${options.title || 'Confirm Action'}
                            </h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="text-center mb-3">
                                <i class="fas fa-${this.getIcon(options.type || 'warning')} fa-3x text-${options.type || 'warning'}"></i>
                            </div>
                            <h6 class="text-center mb-3">${options.message}</h6>
                            ${options.detail ? `<div class="alert alert-${options.type || 'warning'} mb-0"><small>${options.detail}</small></div>` : ''}
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                                <i class="fas fa-times me-1"></i> Cancel
                            </button>
                            <button type="button" class="btn btn-${options.type || 'warning'}" id="confirmBtn">
                                <i class="fas fa-check me-1"></i> ${options.confirmText || 'Confirm'}
                            </button>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            const bsModal = new bootstrap.Modal(modal);
            bsModal.show();
            
            modal.querySelector('#confirmBtn').addEventListener('click', () => {
                bsModal.hide();
                resolve(true);
            });
            
            modal.addEventListener('hidden.bs.modal', () => {
                modal.remove();
                resolve(false);
            });
        });
    },
    
    // Show password generated modal
    showPasswordModal(password, username) {
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.innerHTML = `
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header bg-success text-white">
                        <h5 class="modal-title">
                            <i class="fas fa-check-circle me-2"></i>
                            User Created Successfully
                        </h5>
                    </div>
                    <div class="modal-body">
                        <div class="alert alert-warning mb-3">
                            <i class="fas fa-exclamation-triangle me-2"></i>
                            <strong>Important:</strong> Please save this password securely. It cannot be recovered later.
                        </div>
                        <div class="mb-3">
                            <label class="form-label fw-bold">Username</label>
                            <div class="input-group">
                                <input type="text" class="form-control" value="${username}" readonly>
                                <button class="btn btn-outline-secondary" onclick="navigator.clipboard.writeText('${username}')">
                                    <i class="fas fa-copy"></i>
                                </button>
                            </div>
                        </div>
                        <div class="mb-3">
                            <label class="form-label fw-bold">Generated Password</label>
                            <div class="input-group">
                                <input type="text" class="form-control bg-light fw-bold text-primary" value="${password}" readonly id="genPassword">
                                <button class="btn btn-outline-secondary" onclick="navigator.clipboard.writeText('${password}'); NotificationUI.showToast('Password copied to clipboard!', 'success')">
                                    <i class="fas fa-copy"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-primary" data-bs-dismiss="modal">
                            <i class="fas fa-check me-1"></i> I've Saved the Password
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        const bsModal = new bootstrap.Modal(modal, { backdrop: 'static' });
        bsModal.show();
        
        modal.addEventListener('hidden.bs.modal', () => modal.remove());
    },
    
    // Show error modal
    showError(message, details = null) {
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.innerHTML = `
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header bg-danger text-white">
                        <h5 class="modal-title">
                            <i class="fas fa-exclamation-circle me-2"></i>
                            Error
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="text-center mb-3">
                            <i class="fas fa-exclamation-circle fa-3x text-danger"></i>
                        </div>
                        <p class="text-center mb-0">${message}</p>
                        ${details ? `<small class="text-muted d-block mt-2 text-center">${details}</small>` : ''}
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();
        
        modal.addEventListener('hidden.bs.modal', () => modal.remove());
    },
    
    // Helper methods
    getToastContainer() {
        let container = document.getElementById('toastContainer');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toastContainer';
            container.className = 'toast-container position-fixed top-0 end-0 p-3';
            container.style.zIndex = '9999';
            document.body.appendChild(container);
        }
        return container;
    },
    
    getIcon(type) {
        const icons = {
            success: 'check-circle',
            danger: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle',
            primary: 'info-circle'
        };
        return icons[type] || 'info-circle';
    }
};

// Fetch roles and departments
function fetchRolesAndDepartments() {
    fetch('controller/fetchRolesDepartments.php')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                displayRoles(data.roles);
                displayDepartments(data.departments);
            }
        })
        .catch(error => {
            console.error('Error', error);
            NotificationUI.showError('Failed to load roles and departments', error.message);
        });
}

function displayRoles(roles) {
    const newRolesDropdown = document.getElementById('newRolesDropdown');
    const editRolesDropdown = document.getElementById('editRolesDropdown');
    const filterRole = document.getElementById('filterRole');
    
    [newRolesDropdown, editRolesDropdown, filterRole].forEach(dropdown => {
        if (dropdown) {
            const firstOption = dropdown.querySelector('option:first-child');
            dropdown.innerHTML = '';
            if (firstOption) dropdown.appendChild(firstOption.cloneNode(true));
        }
    });
    
    roles.forEach(role => {
        const option = document.createElement('option');
        option.value = role.id;
        option.textContent = role.role_name;
        
        if (newRolesDropdown) newRolesDropdown.appendChild(option.cloneNode(true));
        if (editRolesDropdown) editRolesDropdown.appendChild(option.cloneNode(true));
        if (filterRole) filterRole.appendChild(option.cloneNode(true));
    });
}

function displayDepartments(departments) {
    const newDepartmentsDropdown = document.getElementById('newDepartmentsDropdown');
    const editDepartmentsDropdown = document.getElementById('editDepartmentsDropdown');
    const filterDept = document.getElementById('filterDept');

    [newDepartmentsDropdown, editDepartmentsDropdown, filterDept].forEach(dropdown => {
        if (dropdown) {
            const firstOption = dropdown.querySelector('option:first-child');
            dropdown.innerHTML = '';
            if (firstOption) dropdown.appendChild(firstOption.cloneNode(true));
        }
    });

    departments.forEach(dept => {
        const option = document.createElement('option');
        option.value = dept.id;
        option.textContent = dept.department_name;
        
        if (newDepartmentsDropdown) newDepartmentsDropdown.appendChild(option.cloneNode(true));
        if (editDepartmentsDropdown) editDepartmentsDropdown.appendChild(option.cloneNode(true));
        if (filterDept) filterDept.appendChild(option.cloneNode(true));
    });
}

/**
 * Initialize the users page
 */
window.init_users = function() {
    fetchRolesAndDepartments();
    loadEmployees();
    initializePasswordToggle();
};

function initializePasswordToggle() {
    const toggleBtn = document.getElementById('togglePasswordBtn');
    const passwordField = document.getElementById('editPassword');
    
    if (toggleBtn && passwordField) {
        toggleBtn.addEventListener('click', function() {
            const icon = this.querySelector('i');
            if (passwordField.type === 'password') {
                passwordField.type = 'text';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            } else {
                passwordField.type = 'password';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
        });
    }
}

function loadEmployees() {
    const tbody = document.querySelector('#usersTableBody');
    if (!tbody) return;

    tbody.innerHTML = `<tr><td colspan="8" class="text-center">
        <div class="spinner-border spinner-border-sm text-primary" role="status">
            <span class="visually-hidden">Loading...</span>
        </div> Loading users...
    </td></tr>`;

    fetch('controller/userController.php?action=fetchUsers')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const users = data.users;
                updateUserStats(users);
                
                if (users.length === 0) {
                    tbody.innerHTML = `<tr><td colspan="8" class="text-center text-muted">
                        <i class="fas fa-users fa-2x mb-2 d-block"></i>
                        No users found.
                    </td></tr>`;
                    return;
                }

                tbody.innerHTML = users.map(emp => `
                    <tr>
                        <td>${emp.full_name}</td>
                        <td>${emp.user_id}</td>
                        <td>${emp.email}</td>
                        <td>${emp.role_name}</td>
                        <td>${emp.department_name}</td>
                        <td>
                            <span class="badge bg-${emp.status === 'Active' ? 'success' : 'warning'}">
                                ${emp.status}
                            </span>
                        </td>
                        <td>${emp.last_login ? new Date(emp.last_login).toLocaleString() : 'Never'}</td>
                        <td>
                            <div class="d-flex gap-1">
                                <button class="btn btn-sm btn-primary" onclick="editEmployee(${emp.id})" title="Edit">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn btn-sm btn-${emp.status === 'Active' ? 'warning' : 'success'}" 
                                        onclick="toggleStatus(${emp.id}, '${emp.status}', '${emp.full_name}')" 
                                        title="${emp.status === 'Active' ? 'Deactivate' : 'Activate'}">
                                    <i class="fas fa-${emp.status === 'Active' ? 'toggle-off' : 'toggle-on'}"></i>
                                </button>
                                <button class="btn btn-sm btn-danger" onclick="deleteEmployee(${emp.id}, '${emp.full_name}')" title="Delete">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </td>
                    </tr>
                `).join('');
            } else {
                tbody.innerHTML = `<tr><td colspan="8" class="text-center text-danger">${data.message}</td></tr>`;
            }
        })
        .catch(error => {
            console.error('Error fetching employees:', error);
            tbody.innerHTML = `<tr><td colspan="8" class="text-center text-danger">
                <i class="fas fa-exclamation-triangle me-2"></i>
                Error loading users. Please try again.
            </td></tr>`;
            NotificationUI.showError('Failed to load users', error.message);
        });
}

function updateUserStats(users) {
    const totalUsers = users.length;
    const activeUsers = users.filter(u => u.status === 'Active').length;
    const inactiveUsers = users.filter(u => u.status === 'Inactive').length;
    
    document.getElementById('totalUsers').textContent = totalUsers;
    document.getElementById('activeUsers').textContent = activeUsers;
    document.getElementById('inactiveUsers').textContent = inactiveUsers;
    document.getElementById('onlineUsers').textContent = '0';
}

// Helper function to escape HTML
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

async function createUser() {
    const firstName = document.getElementById('newFirstName').value.trim();
    const lastName = document.getElementById('newLastName').value.trim();
    const username = document.getElementById('newUserId').value.trim();
    const email = document.getElementById('newEmail').value.trim();
    const roleId = document.getElementById('newRolesDropdown').value;
    const departmentId = document.getElementById('newDepartmentsDropdown').value;
    const status = document.getElementById('newStatus').value;

    // Validate
    if (!firstName || !lastName || !username || !email || !roleId || !departmentId || !status) {
        NotificationUI.showError('Please fill in all required fields', 'All fields marked with * are required.');
        return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        NotificationUI.showError('Invalid email address', 'Please enter a valid email address.');
        return;
    }

    const formData = new FormData();
    formData.append('action', 'createUser');
    formData.append('firstName', firstName);
    formData.append('lastName', lastName);
    formData.append('username', username);
    formData.append('email', email);
    formData.append('roleId', roleId);
    formData.append('departmentId', departmentId);
    formData.append('status', status);

    try {
        const res = await fetch('controller/userController.php', {
            method: 'POST',
            body: formData
        });
        
        const result = await res.json();
        
        if (result.success) {
            // Extract password from message
            const passwordMatch = result.message.match(/Default password: (.+)/);
            
            if (passwordMatch) {
                const password = passwordMatch[1];
                NotificationUI.showPasswordModal(password, username);
            } else {
                NotificationUI.showToast(result.message, 'success');
            }
            
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('newUserModal'));
            modal.hide();
            
            // Reset form
            document.getElementById('newUserForm').reset();
            
            // Reload table
            loadEmployees();
        } else {
            NotificationUI.showError('Failed to create user', result.message);
        }
    } catch (err) {
        console.error(err);
        NotificationUI.showError('An error occurred while creating the user', 'Please check your connection and try again.');
    }
}

async function editEmployee(userId) {
    try {
        const res = await fetch(`controller/userController.php?action=getUserById&id=${userId}`);
        const result = await res.json();
        
        if (result.success) {
            const user = result.user;
            
            // Populate edit form
            document.getElementById('editUserId').value = user.id;
            document.getElementById('editFirstName').value = user.first_name;
            document.getElementById('editLastName').value = user.last_name;
            document.getElementById('editUserIdField').value = user.user_id;
            document.getElementById('editEmail').value = user.email;
            document.getElementById('editPassword').value = user.password;
            document.getElementById('editStatus').value = user.status;
            document.getElementById('editRolesDropdown').value = user.role_id;
            document.getElementById('editDepartmentsDropdown').value = user.department_id;
            
            // Show modal
            const modal = new bootstrap.Modal(document.getElementById('editUserModal'));
            modal.show();
        } else {
            NotificationUI.showError('Failed to load user data', result.message);
        }
    } catch (err) {
        console.error(err);
        NotificationUI.showError('Error loading user data', 'Please check your connection and try again.');
    }
}

async function updateUser() {
    const userId = document.getElementById('editUserId').value;
    const firstName = document.getElementById('editFirstName').value.trim();
    const lastName = document.getElementById('editLastName').value.trim();
    const username = document.getElementById('editUserIdField').value.trim();
    const email = document.getElementById('editEmail').value.trim();
    const roleId = document.getElementById('editRolesDropdown').value;
    const departmentId = document.getElementById('editDepartmentsDropdown').value;
    const status = document.getElementById('editStatus').value;

    // Validate (password removed from validation)
    if (!firstName || !lastName || !username || !email || !roleId || !departmentId || !status) {
        NotificationUI.showError('Please fill in all required fields', 'All fields marked with * are required.');
        return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        NotificationUI.showError('Invalid email address', 'Please enter a valid email address.');
        return;
    }

    // Show confirmation before updating
    const confirmed = await NotificationUI.showConfirm({
        title: 'Update User Information',
        message: `Are you sure you want to update "${escapeHtml(firstName + ' ' + lastName)}"?`,
        detail: 'All changes will be saved to the user profile.',
        type: 'primary',
        confirmText: 'Update User'
    });
    
    if (!confirmed) return;

    const formData = new FormData();
    formData.append('action', 'updateUser');
    formData.append('id', userId);
    formData.append('firstName', firstName);
    formData.append('lastName', lastName);
    formData.append('username', username);
    formData.append('email', email);
    // Password is NOT included - it remains unchanged
    formData.append('roleId', roleId);
    formData.append('departmentId', departmentId);
    formData.append('status', status);

    try {
        const res = await fetch('controller/userController.php', {
            method: 'POST',
            body: formData
        });
        
        const result = await res.json();
        
        if (result.success) {
            NotificationUI.showToast('User updated successfully', 'success');
            
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('editUserModal'));
            modal.hide();
            
            // Reload table
            loadEmployees();
        } else {
            NotificationUI.showError('Failed to update user', result.message);
        }
    } catch (err) {
        console.error(err);
        NotificationUI.showError('An error occurred while updating the user', 'Please check your connection and try again.');
    }
}

/**
 * Toggle user status with confirmation
 */
async function toggleStatus(userId, currentStatus, userName) {
    const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
    
    const confirmed = await NotificationUI.showConfirm({
        title: `${newStatus === 'Active' ? 'Activate' : 'Deactivate'} User`,
        message: `Are you sure you want to ${newStatus === 'Active' ? 'activate' : 'deactivate'} "${escapeHtml(userName)}"?`,
        detail: newStatus === 'Inactive' 
            ? 'The user will not be able to log in until reactivated.' 
            : 'The user will be able to log in and access the system.',
        type: newStatus === 'Active' ? 'success' : 'warning',
        confirmText: newStatus === 'Active' ? 'Activate' : 'Deactivate'
    });
    
    if (!confirmed) return;

    const formData = new FormData();
    formData.append('action', 'toggleStatus');
    formData.append('id', userId);
    formData.append('status', newStatus);

    try {
        const res = await fetch('controller/userController.php', {
            method: 'POST',
            body: formData
        });
        
        const result = await res.json();
        
        if (result.success) {
            NotificationUI.showToast(result.message, 'success');
            loadEmployees();
        } else {
            NotificationUI.showError('Failed to toggle status', result.message);
        }
    } catch (err) {
        console.error(err);
        NotificationUI.showError('An error occurred while toggling status', 'Please check your connection and try again.');
    }
}

/**
 * Delete user with confirmation
 */
async function deleteEmployee(userId, userName) {
    const confirmed = await NotificationUI.showConfirm({
        title: 'Delete User',
        message: `Are you sure you want to delete "${escapeHtml(userName)}"?`,
        detail: 'This action cannot be undone. All user data will be permanently removed from the system.',
        type: 'danger',
        confirmText: 'Delete User'
    });
    
    if (!confirmed) return;

    const formData = new FormData();
    formData.append('action', 'deleteUser');
    formData.append('id', userId);

    try {
        const res = await fetch('controller/userController.php', {
            method: 'POST',
            body: formData
        });
        
        const result = await res.json();
        
        if (result.success) {
            NotificationUI.showToast(result.message, 'success');
            loadEmployees();
        } else {
            NotificationUI.showError('Failed to delete user', result.message);
        }
    } catch (err) {
        console.error(err);
        NotificationUI.showError('An error occurred while deleting the user', 'Please check your connection and try again.');
    }
}

// Add loadUsers alias for the search button
window.loadUsers = loadEmployees;