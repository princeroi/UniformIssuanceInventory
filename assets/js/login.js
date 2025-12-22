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
            // Set client-side session with ROLE and PERMISSIONS
            sessionStorage.setItem('isLoggedIn', 'true');
            sessionStorage.setItem('userName', data.user.name);
            sessionStorage.setItem('userId', data.user.user_id);
            sessionStorage.setItem('userRole', data.user.role_name);
            sessionStorage.setItem('roleId', data.user.role_id);
            sessionStorage.setItem('permissions', JSON.stringify(data.user.permissions));
            
            console.log('User logged in:', {
                name: data.user.name,
                role: data.user.role_name,
                permissions: data.user.permissions
            });
            
            // Redirect based on role
            setTimeout(() => {
                if (data.user.role_name.toLowerCase() === 'recruiter') {
                    // Recruiters go directly to POS
                    window.location.href = "../index.php?page=pos";
                } else {
                    // Others go to dashboard
                    window.location.href = "../index.php";
                }
            }, 500);
        } else {
            showAlert(data.message, 'danger');
            
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

// Helper function to show alerts
function showAlert(message, type = 'danger') {
    const alertContainer = document.getElementById('alertContainer');
    if (alertContainer) {
        alertContainer.innerHTML = `
            <div class="alert alert-${type} alert-dismissible fade show" role="alert">
                <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'} me-2"></i>
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;
    } else {
        alert(message);
    }
}