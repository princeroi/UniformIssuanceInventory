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
    // Check user credentials WITH ROLE
    // ---------------------------
    $stmt = $pdo->prepare("
        SELECT 
            u.user_id, 
            u.password, 
            u.first_name, 
            u.last_name, 
            u.role_id,
            r.role_name,
            r.id as role_table_id
        FROM users u
        LEFT JOIN roles r ON u.role_id = r.id
        WHERE u.user_id = :user_id 
        LIMIT 1
    ");
    $stmt->execute(['user_id' => $user_id]);
    $user = $stmt->fetch();

    if (!$user || !password_verify($password, $user['password'])) {
        echo json_encode(['success' => false, 'message' => 'Invalid User ID or Password']);
        exit;
    }

    // Check if role exists
    if (!$user['role_name']) {
        echo json_encode(['success' => false, 'message' => 'User role not found. Contact administrator.']);
        exit;
    }

    // ---------------------------
    // LOGIN SUCCESS - Set session variables with ROLE
    // ---------------------------
    $_SESSION['logged_in'] = true;
    $_SESSION['user_id'] = $user['user_id'];
    $_SESSION['name'] = $user['first_name'] . ' ' . $user['last_name'];
    $_SESSION['first_name'] = $user['first_name'];
    $_SESSION['last_name'] = $user['last_name'];
    $_SESSION['role_id'] = $user['role_id'];
    $_SESSION['role_name'] = $user['role_name'];

    // Define role permissions - UPDATED FOR YOUR REQUIREMENTS
    $permissions = [];
    
    switch(strtolower($user['role_name'])) {
        case 'administrator':
            $permissions = [
                'dashboard' => true,
                'pos' => true,
                'issuance' => true,
                'deliveries' => true,
                'inventory' => true,
                'users' => true,
                'reports' => true,
                'history' => true,
                'settings' => true
            ];
            break;
            
        case 'manager':
            $permissions = [
                'dashboard' => true,
                'pos' => true,
                'issuance' => true,
                'deliveries' => true,
                'inventory' => true,
                'users' => true,
                'reports' => true,
                'history' => true,
                'settings' => false
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
                'users' => false,
                'reports' => true,          // Can view (read-only)
                'history' => true,          // Can view (read-only)
                'settings' => false,
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
                'users' => false,
                'reports' => false,
                'history' => false,
                'settings' => false
            ];
            break;
            
        default:
            $permissions = [
                'dashboard' => false,
                'pos' => false,
                'issuance' => false,
                'deliveries' => false,
                'inventory' => false,
                'users' => false,
                'reports' => false,
                'history' => false,
                'settings' => false
            ];
    }

    echo json_encode([
        'success' => true,
        'user' => [
            'user_id' => $user['user_id'],
            'name' => $user['first_name'] . ' ' . $user['last_name'],
            'role_id' => $user['role_id'],
            'role_name' => $user['role_name'],
            'permissions' => $permissions
        ]
    ]);

} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Server error: ' . $e->getMessage()]);
}
?>