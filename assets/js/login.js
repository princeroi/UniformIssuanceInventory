// assets/js/login.js
// File is login.php (NOT loginp.php)
// login.html is in pages/ folder

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
        // Correct path: ../controller/login.php
        const response = await fetch("../controller/login.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                user_id: document.getElementById("user_id").value,
                password: document.getElementById("password").value
            })
        });

        console.log("HTTP status:", response.status);
        console.log("Request URL:", response.url);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log("Response data:", data);

        if (data.success) {
            // Set client-side session flag
            sessionStorage.setItem('isLoggedIn', 'true');
            sessionStorage.setItem('userName', data.user.name);
            sessionStorage.setItem('userId', data.user.user_id);
            
            // // Show success message
            // showAlert("Login successful! Redirecting...", 'success');
            
            // Redirect to index.html
            setTimeout(() => {
                window.location.href = "../index.php";
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