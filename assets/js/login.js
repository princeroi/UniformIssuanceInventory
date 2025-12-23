// assets/js/login.js
document.getElementById("loginForm").addEventListener("submit", async function (e) {
    e.preventDefault();

    const btn = document.querySelector(".btn-login");
    const btnText = btn.querySelector(".btn-text");
    const btnLoader = btn.querySelector(".btn-loader");

    if (btnText && btnLoader) {
        btnText.classList.add("d-none");
        btnLoader.classList.remove("d-none");
    }
    btn.disabled = true;

    try {
        const response = await fetch("../controller/login.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                user_id: document.getElementById("user_id").value,
                password: document.getElementById("password").value
            })
        });

        console.log("HTTP status:", response.status);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log("Response data:", data);

        if (data.success) {
            if (data.user.status !== 'Active') {
                showAlert('Your account is inactive. Please contact your administrator.', 'warning', true);
                
                if (btnText && btnLoader) {
                    btnText.classList.remove("d-none");
                    btnLoader.classList.add("d-none");
                }
                btn.disabled = false;
                return;
            }

            // Set client-side session with ROLE and PERMISSIONS
            sessionStorage.setItem('isLoggedIn', 'true');
            sessionStorage.setItem('userName', data.user.name);
            sessionStorage.setItem('userId', data.user.user_id);
            sessionStorage.setItem('userRole', data.user.role_name);
            sessionStorage.setItem('roleId', data.user.role_id);
            sessionStorage.setItem('userStatus', data.user.status);
            
            // Store simplified permissions (for menu visibility)
            sessionStorage.setItem('permissions', JSON.stringify(data.user.permissions));
            
            // Store detailed permissions (for granular access control - add/edit/delete)
            sessionStorage.setItem('user_permissions', JSON.stringify(data.user.permissions_detailed));
            
            console.log('User logged in:', {
                name: data.user.name,
                role: data.user.role_name,
                status: data.user.status,
                permissions: data.user.permissions,
                detailed_permissions: data.user.permissions_detailed
            });
            
            // Redirect based on role
            setTimeout(() => {
                if (data.user.role_name.toLowerCase() === 'recruiter') {
                    window.location.href = "../index.php?page=pos";
                } else {
                    window.location.href = "../index.php";
                }
            }, 1000);
        } else {
            if (data.error_type === 'inactive_account') {
                showAlert(data.message, 'warning', true);
            } else {
                showAlert(data.message, 'danger', false);
            }
            
            if (btnText && btnLoader) {
                btnText.classList.remove("d-none");
                btnLoader.classList.add("d-none");
            }
            btn.disabled = false;
        }

    } catch (err) {
        console.error("Fetch/login error:", err);
        showAlert("Server error: " + err.message, 'danger');
        
        if (btnText && btnLoader) {
            btnText.classList.remove("d-none");
            btnLoader.classList.add("d-none");
        }
        btn.disabled = false;
    }
});

function showAlert(message, type = 'danger', isInactiveAccount = false) {
    const alertContainer = document.getElementById('alertContainer');
    
    const iconMap = {
        success: 'check-circle',
        danger: 'exclamation-circle',
        warning: 'exclamation-triangle',
        info: 'info-circle'
    };
    
    const icon = iconMap[type] || 'info-circle';
    
    if (isInactiveAccount) {
        showInactiveAccountModal(message);
        return;
    }
    
    if (alertContainer) {
        alertContainer.innerHTML = `
            <div class="alert alert-${type} alert-dismissible fade show" role="alert">
                <i class="fas fa-${icon} me-2"></i>
                <strong>${message}</strong>
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;
        
        if (type === 'success' || type === 'info') {
            setTimeout(() => {
                const alert = alertContainer.querySelector('.alert');
                if (alert) {
                    const bsAlert = new bootstrap.Alert(alert);
                    bsAlert.close();
                }
            }, 5000);
        }
    } else {
        alert(message);
    }
}

function showInactiveAccountModal(message) {
    const existingModal = document.getElementById('inactiveAccountModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.id = 'inactiveAccountModal';
    modal.innerHTML = `
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content border-warning">
                <div class="modal-header bg-warning text-dark">
                    <h5 class="modal-title">
                        <i class="fas fa-exclamation-triangle me-2"></i>
                        Account Inactive
                    </h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body text-center">
                    <div class="mb-4">
                        <i class="fas fa-user-lock fa-4x text-warning"></i>
                    </div>
                    <h5 class="mb-3">Your account has been deactivated</h5>
                    <p class="text-muted mb-4">${message}</p>
                    <div class="alert alert-light border">
                        <small class="text-muted">
                            <i class="fas fa-info-circle me-2"></i>
                            If you believe this is an error, please reach out to your system administrator.
                        </small>
                    </div>
                </div>
                <div class="modal-footer justify-content-center">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                        <i class="fas fa-times me-1"></i> Close
                    </button>
                    <button type="button" class="btn btn-primary" onclick="window.location.href='mailto:admin@example.com'">
                        <i class="fas fa-envelope me-1"></i> Contact Administrator
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    const bsModal = new bootstrap.Modal(modal, { backdrop: 'static', keyboard: false });
    bsModal.show();
    
    modal.addEventListener('hidden.bs.modal', () => {
        modal.remove();
    });
}

document.getElementById('user_id')?.addEventListener('input', () => {
    const alertContainer = document.getElementById('alertContainer');
    if (alertContainer) {
        alertContainer.innerHTML = '';
    }
});

document.getElementById('password')?.addEventListener('input', () => {
    const alertContainer = document.getElementById('alertContainer');
    if (alertContainer) {
        alertContainer.innerHTML = '';
    }
});