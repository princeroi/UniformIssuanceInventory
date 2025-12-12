<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Uniform Issuance System - Login</title>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.2/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    <link href="css/styles.css" rel="stylesheet">
</head>
<body>
    <div class="login-container">
        <div class="container">
            <div class="row justify-content-center align-items-center min-vh-100">
                <div class="col-md-10 col-lg-8">
                    <div class="card login-card shadow-lg">
                        <div class="row g-0">
                            <!-- Left Side - Branding -->
                            <div class="col-md-6 login-left">
                                <div class="brand-content">
                                    <div class="brand-icon mb-4">
                                        <i class="fas fa-tshirt"></i>
                                    </div>
                                    <h2 class="brand-title">Uniform Issuance</h2>
                                    <p class="brand-subtitle">Inventory Management System</p>
                                    <div class="brand-features mt-5">
                                        <div class="feature-item">
                                            <i class="fas fa-check-circle"></i>
                                            <span>Track Inventory in Real-time</span>
                                        </div>
                                        <div class="feature-item">
                                            <i class="fas fa-check-circle"></i>
                                            <span>Manage Uniform Distribution</span>
                                        </div>
                                        <div class="feature-item">
                                            <i class="fas fa-check-circle"></i>
                                            <span>Generate Detailed Reports</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Right Side - Login Form -->
                            <div class="col-md-6 login-right">
                                <div class="login-form-container">
                                    <h3 class="login-title mb-2">Welcome Back</h3>
                                    <p class="login-subtitle mb-4">Please login to your account</p>

                                    <form id="loginForm">
                                        <div class="form-group mb-3">
                                            <label class="form-label">Username or Email</label>
                                            <div class="input-group">
                                                <span class="input-group-text">
                                                    <i class="fas fa-user"></i>
                                                </span>
                                                <input type="text" class="form-control" id="username" placeholder="Enter your username" required>
                                            </div>
                                        </div>

                                        <div class="form-group mb-3">
                                            <label class="form-label">Password</label>
                                            <div class="input-group">
                                                <span class="input-group-text">
                                                    <i class="fas fa-lock"></i>
                                                </span>
                                                <input type="password" class="form-control" id="password" placeholder="Enter your password" required>
                                                <button class="btn btn-outline-secondary" type="button" id="togglePassword">
                                                    <i class="fas fa-eye"></i>
                                                </button>
                                            </div>
                                        </div>

                                        <div class="form-group mb-4 d-flex justify-content-between align-items-center">
                                            <div class="form-check">
                                                <input class="form-check-input" type="checkbox" id="rememberMe">
                                                <label class="form-check-label" for="rememberMe">
                                                    Remember me
                                                </label>
                                            </div>
                                            <a href="#" class="forgot-password">Forgot Password?</a>
                                        </div>

                                        <button type="submit" class="btn btn-primary btn-login w-100 mb-3">
                                            <span class="btn-text">Login</span>
                                            <span class="btn-loader d-none">
                                                <i class="fas fa-spinner fa-spin"></i>
                                            </span>
                                        </button>

                                        <div class="text-center">
                                            <small class="text-muted">Don't have an account? <a href="#" class="link-primary">Contact Administrator</a></small>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script src="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.2/js/bootstrap.bundle.min.js"></script>
    <script>
        // Toggle Password Visibility
        document.getElementById('togglePassword').addEventListener('click', function() {
            const passwordInput = document.getElementById('password');
            const icon = this.querySelector('i');
            
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            } else {
                passwordInput.type = 'password';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
        });

        // Login Form Submit
        document.getElementById('loginForm').addEventListener('submit', function(e) {
            e.preventDefault();
            
            const btn = this.querySelector('.btn-login');
            const btnText = btn.querySelector('.btn-text');
            const btnLoader = btn.querySelector('.btn-loader');
            
            // Show loading state
            btnText.classList.add('d-none');
            btnLoader.classList.remove('d-none');
            btn.disabled = true;
            
            // Simulate login process
            setTimeout(function() {
                btnText.classList.remove('d-none');
                btnLoader.classList.add('d-none');
                btn.disabled = false;
                
                // Show success message (you can redirect to dashboard here)
                alert('Login successful! Redirecting to dashboard...');
            }, 1500);
        });

        // Input Focus Effect
        document.querySelectorAll('.form-control').forEach(input => {
            input.addEventListener('focus', function() {
                this.parentElement.classList.add('focused');
            });
            
            input.addEventListener('blur', function() {
                if (!this.value) {
                    this.parentElement.classList.remove('focused');
                }
            });
        });
    </script>
</body>
</html>