<?php
// controller/login.php
session_start();

// Report errors as exceptions instead of HTML
ini_set('display_errors', 0);
ini_set('display_startup_errors', 0);
error_reporting(E_ALL);

header('Content-Type: application/json');

try {
    // ---------------------------
    // Create PDO connection
    // ---------------------------
    $host = 'localhost';
    $db   = 'uniformissuanceinventory';
    $user = 'root';
    $pass = '';
    $charset = 'utf8mb4';

    $dsn = "mysql:host=$host;dbname=$db;charset=$charset";
    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ];

    $pdo = new PDO($dsn, $user, $pass, $options);

    // ---------------------------
    // Get JSON input
    // ---------------------------
    $data = json_decode(file_get_contents("php://input"), true);
    $user_id  = $data['user_id'] ?? '';
    $password = $data['password'] ?? '';

    if (!$user_id || !$password) {
        echo json_encode(['success' => false, 'message' => 'Missing credentials']);
        exit;
    }

    // ---------------------------
    // Check user credentials WITH ROLE, STATUS AND DEPARTMENT
    // ---------------------------
    $stmt = $pdo->prepare("
        SELECT 
            u.user_id, 
            u.password, 
            u.first_name, 
            u.last_name, 
            u.role_id,
            u.department_id,
            u.status,
            r.role_name,
            r.id as role_table_id,
            d.department_name
        FROM users u
        LEFT JOIN roles r ON u.role_id = r.id
        LEFT JOIN departments d ON u.department_id = d.id
        WHERE u.user_id = :user_id 
        LIMIT 1
    ");
    $stmt->execute(['user_id' => $user_id]);
    $user = $stmt->fetch();

    // Check if user exists
    if (!$user) {
        echo json_encode(['success' => false, 'message' => 'Invalid User ID or Password']);
        exit;
    }

    // Check if password is correct
    if (!password_verify($password, $user['password'])) {
        echo json_encode(['success' => false, 'message' => 'Invalid User ID or Password']);
        exit;
    }

    // Check if user account is Active
    if ($user['status'] !== 'Active') {
        echo json_encode([
            'success' => false, 
            'message' => 'Account is inactive. Please contact your administrator.',
            'error_type' => 'inactive_account'
        ]);
        exit;
    }

    // Check if role exists
    if (!$user['role_name']) {
        echo json_encode(['success' => false, 'message' => 'User role not found. Contact administrator.']);
        exit;
    }

    // ---------------------------
    // LOGIN SUCCESS - Set session variables with ROLE AND DEPARTMENT
    // ---------------------------
    $_SESSION['logged_in'] = true;
    $_SESSION['user_id'] = $user['user_id'];
    $_SESSION['name'] = $user['first_name'] . ' ' . $user['last_name'];
    $_SESSION['first_name'] = $user['first_name'];
    $_SESSION['last_name'] = $user['last_name'];
    $_SESSION['role_id'] = $user['role_id'];
    $_SESSION['role_name'] = $user['role_name'];
    $_SESSION['department_id'] = $user['department_id'];
    $_SESSION['department_name'] = $user['department_name'];
    $_SESSION['status'] = $user['status'];

    // Update last login timestamp
    $updateStmt = $pdo->prepare("UPDATE users SET last_login = NOW() WHERE user_id = ?");
    $updateStmt->execute([$user['user_id']]);

    // Define role permissions with DEPARTMENT-BASED ACCESS CONTROL
    $permissions = [];
    $roleName = strtolower($user['role_name']);
    $departmentName = strtolower($user['department_name'] ?? '');
    
    // Determine if user can access Users and Settings
    $canAccessUsers = false;
    $canAccessSettings = false;
    
    if ($roleName === 'administrator') {
        // Administrators can access everything
        $canAccessUsers = true;
        $canAccessSettings = true;
    } elseif ($roleName === 'manager') {
        // Managers of ALL departments can access Users
        $canAccessUsers = true;
        $canAccessSettings = false;
        
        // Only IT Department managers can access Settings
        if ($departmentName === 'it' || $departmentName === 'it department' || $departmentName === 'information technology') {
            $canAccessSettings = true;
        }
    } elseif ($departmentName === 'it' || $departmentName === 'it department' || $departmentName === 'information technology') {
        // IT Department users (non-managers) can access Users and Settings
        $canAccessUsers = true;
        $canAccessSettings = true;
    } elseif ($departmentName === 'hr' || $departmentName === 'human resources') {
        // HR Department users CANNOT access Users or Settings
        $canAccessUsers = false;
        $canAccessSettings = false;
    }
    
    switch($roleName) {
        case 'administrator':
            $permissions = [
                'dashboard' => true,
                'pos' => true,
                'issuance' => true,
                'deliveries' => true,
                'inventory' => true,
                'users' => $canAccessUsers,
                'reports' => true,
                'history' => true,
                'settings' => $canAccessSettings
            ];
            break;
            
        case 'manager':
            $permissions = [
                'dashboard' => true,
                'pos' => true,
                'issuance' => true,
                'deliveries' => true,
                'inventory' => true,
                'users' => $canAccessUsers,
                'reports' => true,
                'history' => true,
                'settings' => $canAccessSettings
            ];
            break;
            
        case 'supervisor':
            // SUPERVISOR: Can issue in POS + view all pages except Users/Settings
            $permissions = [
                'dashboard' => true,
                'pos' => true,              // CAN ISSUE (modify)
                'issuance' => true,         // Can view (read-only for own data)
                'deliveries' => true,       // Can view (read-only)
                'inventory' => true,        // Can view (read-only)
                'users' => $canAccessUsers,
                'reports' => true,          // Can view (read-only)
                'history' => true,          // Can view (read-only)
                'settings' => $canAccessSettings,
                'can_modify' => ['pos']     // Only POS can be modified
            ];
            break;
            
        case 'recruiter':
            // RECRUITER: Can issue in POS + view their own Issuances
            $permissions = [
                'dashboard' => false,
                'pos' => true,              // CAN ISSUE (modify)
                'issuance' => true,         // CAN VIEW (own data only)
                'deliveries' => false,
                'inventory' => false,
                'users' => false,           // Recruiters never access Users
                'reports' => false,
                'history' => false,
                'settings' => false         // Recruiters never access Settings
            ];
            break;
            
        default:
            $permissions = [
                'dashboard' => false,
                'pos' => false,
                'issuance' => false,
                'deliveries' => false,
                'inventory' => false,
                'users' => $canAccessUsers,
                'reports' => false,
                'history' => false,
                'settings' => $canAccessSettings
            ];
    }

    echo json_encode([
        'success' => true,
        'user' => [
            'user_id' => $user['user_id'],
            'name' => $user['first_name'] . ' ' . $user['last_name'],
            'role_id' => $user['role_id'],
            'role_name' => $user['role_name'],
            'department_id' => $user['department_id'],
            'department_name' => $user['department_name'],
            'status' => $user['status'],
            'permissions' => $permissions
        ]
    ]);

} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Server error: ' . $e->getMessage()]);
}
?>