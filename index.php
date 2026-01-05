<?php
session_start();

// Check if user is logged in
if (!isset($_SESSION['logged_in']) || $_SESSION['logged_in'] !== true) {
    header('Location: pages/login.html');
    exit;
}

// Get user info from session
$userName = isset($_SESSION['name']) ? $_SESSION['name'] : 'User';
$userRole = isset($_SESSION['role_name']) ? $_SESSION['role_name'] : '';
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Uniform Issuance Inventory System</title>

    <script>
    // CRITICAL: Immediate redirect if not logged in
    (function() {
        const isLoggedIn = sessionStorage.getItem('isLoggedIn');
        
        if (!isLoggedIn || isLoggedIn !== 'true') {
            console.log('Access denied - not logged in');
            window.location.href = 'pages/login.html';
            // Stop further script execution
            throw new Error('Not authenticated');
        }
    })();
    </script>
    
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" href="assets/css/styles.css">
    <style>

        /* Sidebar - Fixed positioning */
        .sidebar {
            width: 260px;
            background: linear-gradient(180deg, #1f2937 0%, #111827 100%);
            height: 100vh;
            position: fixed;
            top: 0;
            left: 0;
            z-index: 1000;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
        }

        .sidebar-header {
            padding: 1.5rem 1.25rem;
            border-bottom: 1px solid rgba(255,255,255,0.1);
            text-align: center;
            flex-shrink: 0;
        }

        .sidebar-brand {
            color: white;
            font-size: 1.5rem;
            font-weight: 700;
            text-decoration: none;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
        }

        .sidebar-brand:hover {
            color: white;
        }

        .sidebar-menu {
            padding: 0.75rem 0;
            flex: 1;
        }

        .menu-item {
            padding: 0.875rem 1.25rem;
            margin: 0.125rem 0;
            color: rgba(255,255,255,0.7);
            text-decoration: none;
            display: flex;
            align-items: center;
            gap: 0.75rem;
            transition: all 0.15s ease;
            border-left: 3px solid transparent;
            position: relative;
        }

        .menu-item:hover {
            background-color: rgba(255,255,255,0.05);
            color: white;
            border-left-color: #2563eb;
        }

        .menu-item.active {
            background-color: rgba(37, 99, 235, 0.1);
            color: white;
            border-left-color: #2563eb;
        }

        .menu-item i {
            width: 20px;
            text-align: center;
            font-size: 1.1rem;
        }

        /* Main Content Area */
        .main-content {
            margin-left: 260px;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
        }

        /* Navbar */
        .navbar-custom {
            background-color: white;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            padding: 1rem 2rem;
            flex-shrink: 0;
            position: relative;
            z-index: 1050;
        }

        .navbar .dropdown-toggle {
            color: #374151;
            text-decoration: none;
        }

        .navbar .dropdown-toggle:hover {
            color: #2563eb;
        }

        /* Ensure dropdown menu appears above everything */
        .navbar .dropdown-menu {
            z-index: 1060 !important;
        }

        /* User dropdown styling */
        .navbar .dropdown-toggle {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.5rem 1rem;
            border-radius: 0.5rem;
            transition: background-color 0.2s;
        }

        .navbar .dropdown-toggle:hover {
            background-color: rgba(0,0,0,0.05);
        }

        .user-name-display {
            font-size: 0.95rem;
            line-height: 1.2;
        }

        .user-role-display {
            font-size: 0.75rem;
            line-height: 1;
            margin-top: 2px;
        }

        /* Page Content */
        #pageContent {
            flex: 1;
            padding: 2rem;
        }

        /* Scrollbar */
        .sidebar::-webkit-scrollbar {
            width: 6px;
        }

        .sidebar::-webkit-scrollbar-track {
            background: rgba(255,255,255,0.05);
        }

        .sidebar::-webkit-scrollbar-thumb {
            background: rgba(255,255,255,0.2);
            border-radius: 3px;
        }

        .sidebar::-webkit-scrollbar-thumb:hover {
            background: rgba(255,255,255,0.3);
        }

        /* Responsive */
        @media (max-width: 768px) {
            .sidebar {
                transform: translateX(-100%);
            }
            
            .sidebar.active {
                transform: translateX(0);
            }
            
            .main-content {
                margin-left: 0;
            }
        }
    </style>
</head>
<body>
   
    <div class="sidebar" id="sidebar">
        <div class="sidebar-header">
            <a href="#" class="sidebar-brand">
                <i class="fas fa-box"></i>
                <span>UIS</span>
            </a>
        </div>
        
        <nav class="sidebar-menu">
            <a href="pages/dashboard.html" class="menu-item" data-page="dashboard">
                <i class="fas fa-home"></i>
                <span>Dashboard</span>
            </a>
            <a href="pages/pos.html" class="menu-item" data-page="pos">
                <i class="fas fa-cash-register"></i>
                <span>POS</span>
            </a>
            <a href="pages/issuance.html" class="menu-item" data-page="issuance">
                <i class="fas fa-hand-holding"></i>
                <span>Issuance</span>
            </a>
            <a href="pages/deliveries.html" class="menu-item" data-page="deliveries">
                <i class="fas fa-truck"></i>
                <span>Deliveries</span>
            </a>
            <a href="pages/inventory.html" class="menu-item" data-page="inventory">
                <i class="fas fa-boxes"></i>
                <span>Inventory</span>
            </a>
            <a href="pages/users.html" class="menu-item" data-page="users">
                <i class="fas fa-users"></i>
                <span>Users</span>
            </a>
            <!-- <a href="pages/reports.html" class="menu-item" data-page="reports">
                <i class="fas fa-chart-line"></i>
                <span>Reports</span>
            </a>
            <a href="pages/history.html" class="menu-item" data-page="history">
                <i class="fas fa-history"></i>
                <span>History</span>
            </a>-->
            <a href="pages/settings.html" class="menu-item" data-page="settings">
                <i class="fas fa-cog"></i>
                <span>Settings</span>
            </a> 
        </nav>
    </div>

    <div class="main-content">
        <nav class="navbar navbar-expand-lg navbar-custom">
            <div class="container-fluid">
                <button class="btn btn-link d-lg-none" id="sidebarToggle">
                    <i class="fas fa-bars"></i>
                </button>
                
                <div class="ms-auto d-flex align-items-center">
                    <!-- <div class="dropdown">
                        <button class="btn btn-link dropdown-toggle" type="button" data-bs-toggle="dropdown">
                            <i class="fas fa-bell"></i>
                            <span class="badge bg-danger position-absolute">3</span>
                        </button>
                         <ul class="dropdown-menu dropdown-menu-end">
                            <li><a class="dropdown-item" href="#">New order received</a></li>
                            <li><a class="dropdown-item" href="#">Low stock alert</a></li>
                            <li><a class="dropdown-item" href="#">Delivery completed</a></li>
                        </ul> 
                    </div> -->
                    
                    <div class="dropdown ms-3">
                        <button class="btn btn-link dropdown-toggle d-flex align-items-center" type="button" data-bs-toggle="dropdown">
                            <i class="fas fa-user-circle fa-2x me-2"></i>
                            <div class="d-flex flex-column align-items-start text-start">
                                <span class="user-name-display fw-semibold"><?php echo htmlspecialchars($userName); ?></span>
                                <?php if ($userRole): ?>
                                    <small class="text-muted user-role-display"><?php echo htmlspecialchars($userRole); ?></small>
                                <?php endif; ?>
                            </div>
                        </button>
                        <ul class="dropdown-menu dropdown-menu-end">
                            <li class="dropdown-header">
                                <div class="text-center">
                                    <strong><?php echo htmlspecialchars($userName); ?></strong>
                                    <?php if ($userRole): ?>
                                        <br><small class="text-muted"><?php echo htmlspecialchars($userRole); ?></small>
                                    <?php endif; ?>
                                </div>
                            </li>
                            <li><hr class="dropdown-divider"></li>
                            <li><a class="dropdown-item" href="#"><i class="fas fa-user me-2"></i>Profile</a></li>
                            <li><a class="dropdown-item" href="#"><i class="fas fa-cog me-2"></i>Settings</a></li>
                            <li><hr class="dropdown-divider"></li>
                            <li>
                                <a class="dropdown-item text-danger" href="controller/logout.php">
                                    <i class="fas fa-sign-out-alt me-2"></i>Logout
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </nav>

        <div id="pageContent">
            <h2>Welcome to UIS Dashboard</h2>
            <p>Select a menu item to load a page here.</p>
        </div>
    </div>


    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
    <script src="assets/js/notification-ui.js"></script>
    <script src="assets/js/available_pages.js"></script>
    <script src="assets/js/main.js"></script>

    <script>
    // Sync PHP session data with sessionStorage (fallback if not already set)
    document.addEventListener('DOMContentLoaded', function() {
        // Sync from PHP to sessionStorage if needed
        if (!sessionStorage.getItem('userName')) {
            sessionStorage.setItem('userName', '<?php echo addslashes($userName); ?>');
        }
        if (!sessionStorage.getItem('userRole')) {
            sessionStorage.setItem('userRole', '<?php echo addslashes($userRole); ?>');
        }
        
        // Update display from sessionStorage (for consistency)
        updateUserDisplayFromSession();
    });

    function updateUserDisplayFromSession() {
        const userName = sessionStorage.getItem('userName');
        const userRole = sessionStorage.getItem('userRole');
        
        // Update user name display
        const userNameDisplay = document.querySelector('.user-name-display');
        if (userNameDisplay && userName) {
            userNameDisplay.textContent = userName;
        }
        
        // Update user role display
        const userRoleDisplay = document.querySelector('.user-role-display');
        if (userRoleDisplay && userRole) {
            userRoleDisplay.textContent = userRole;
        } else if (!userRoleDisplay && userRole) {
            // Create role display if it doesn't exist
            const userDropdown = document.querySelector('.navbar .dropdown-toggle .d-flex.flex-column');
            if (userDropdown) {
                const roleElement = document.createElement('small');
                roleElement.className = 'text-muted user-role-display';
                roleElement.textContent = userRole;
                userDropdown.appendChild(roleElement);
            }
        }
    }
    </script>

</body>
</html>