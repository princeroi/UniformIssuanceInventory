<?php
// controller/login.php
session_start();

ini_set('display_errors', 0);
ini_set('display_startup_errors', 0);
error_reporting(E_ALL);

header('Content-Type: application/json');

try {
    // Create PDO connection
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

    // Get JSON input
    $data = json_decode(file_get_contents("php://input"), true);
    $user_id  = $data['user_id'] ?? '';
    $password = $data['password'] ?? '';

    if (!$user_id || !$password) {
        echo json_encode(['success' => false, 'message' => 'Missing credentials']);
        exit;
    }

    // Check user credentials
    $stmt = $pdo->prepare("
        SELECT 
            u.id,
            u.user_id, 
            u.password, 
            u.first_name, 
            u.last_name, 
            u.role_id,
            u.department_id,
            u.status,
            r.role_name,
            d.department_name
        FROM users u
        LEFT JOIN roles r ON u.role_id = r.id
        LEFT JOIN departments d ON u.department_id = d.id
        WHERE u.user_id = :user_id 
        LIMIT 1
    ");
    $stmt->execute(['user_id' => $user_id]);
    $user = $stmt->fetch();

    if (!$user) {
        echo json_encode(['success' => false, 'message' => 'Invalid User ID or Password']);
        exit;
    }

    if (!password_verify($password, $user['password'])) {
        echo json_encode(['success' => false, 'message' => 'Invalid User ID or Password']);
        exit;
    }

    if ($user['status'] !== 'Active') {
        echo json_encode([
            'success' => false, 
            'message' => 'Account is inactive. Please contact your administrator.',
            'error_type' => 'inactive_account'
        ]);
        exit;
    }

    if (!$user['role_name']) {
        echo json_encode(['success' => false, 'message' => 'User role not found. Contact administrator.']);
        exit;
    }

    // Set session variables
    $_SESSION['logged_in'] = true;
    $_SESSION['user_id'] = $user['user_id'];
    $_SESSION['db_user_id'] = $user['id']; // Database ID
    $_SESSION['name'] = $user['first_name'] . ' ' . $user['last_name'];
    $_SESSION['first_name'] = $user['first_name'];
    $_SESSION['last_name'] = $user['last_name'];
    $_SESSION['role_id'] = $user['role_id'];
    $_SESSION['role_name'] = $user['role_name'];
    $_SESSION['department_id'] = $user['department_id'];
    $_SESSION['department_name'] = $user['department_name'];
    $_SESSION['status'] = $user['status'];

    // Update last login
    $updateStmt = $pdo->prepare("UPDATE users SET last_login = NOW() WHERE id = ?");
    $updateStmt->execute([$user['id']]);

    // ========================================
    // LOAD PERMISSIONS FROM user_permissions ONLY
    // role_permissions is ONLY used as default template
    // ========================================
    function loadUserPermissions($pdo, $dbUserId) {
        try {
            // Get permissions from user_permissions table ONLY
            $stmt = $pdo->prepare("
                SELECT 
                    page_name, 
                    can_view, 
                    can_add, 
                    can_edit, 
                    can_delete 
                FROM user_permissions 
                WHERE user_id = ?
            ");
            $stmt->execute([$dbUserId]);
            $userPermissions = $stmt->fetchAll(PDO::FETCH_ASSOC);

            $permissions = [];

            // Build permissions array from user_permissions
            foreach ($userPermissions as $perm) {
                $page = $perm['page_name'];
                $permissions[$page] = [
                    'view' => (bool)$perm['can_view'],
                    'add' => (bool)$perm['can_add'],
                    'edit' => (bool)$perm['can_edit'],
                    'delete' => (bool)$perm['can_delete']
                ];
            }

            return $permissions;
        } catch (PDOException $e) {
            error_log('Error loading user permissions: ' . $e->getMessage());
            return [];
        }
    }

    // Load permissions from user_permissions table
    $userPermissions = loadUserPermissions($pdo, $user['id']);
    $_SESSION['user_permissions'] = $userPermissions;

    // Prepare simplified version for frontend
    $jsPermissions = [];
    foreach ($userPermissions as $page => $perms) {
        // Can view = true/false
        $jsPermissions[$page] = $perms['view'];

        // Build list of pages user can modify
        if (!isset($jsPermissions['can_modify'])) {
            $jsPermissions['can_modify'] = [];
        }

        if ($perms['add'] || $perms['edit'] || $perms['delete']) {
            $jsPermissions['can_modify'][] = $page;
        }
    }

    // Store detailed permissions for granular access control
    $_SESSION['user_permissions_detailed'] = $userPermissions;

    // Final JSON response
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
            'permissions' => $jsPermissions,
            'permissions_detailed' => $userPermissions
        ]
    ]);

} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Server error: ' . $e->getMessage()]);
}
?>