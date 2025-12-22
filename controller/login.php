<?php
// controller/login.php (NOT loginp.php)
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
    // Check user credentials
    // ---------------------------
    $stmt = $pdo->prepare("SELECT user_id, password, first_name, last_name FROM users WHERE user_id = :user_id LIMIT 1");
    $stmt->execute(['user_id' => $user_id]);
    $user = $stmt->fetch();

    if (!$user || !password_verify($password, $user['password'])) {
        echo json_encode(['success' => false, 'message' => 'Invalid User ID or Password']);
        exit;
    }

    // ---------------------------
    // LOGIN SUCCESS - Set session variables
    // ---------------------------
    $_SESSION['logged_in'] = true;
    $_SESSION['user_id'] = $user['user_id'];
    $_SESSION['name'] = $user['first_name'] . ' ' . $user['last_name'];
    $_SESSION['first_name'] = $user['first_name'];
    $_SESSION['last_name'] = $user['last_name'];

    echo json_encode([
        'success' => true,
        'user' => [
            'user_id' => $user['user_id'],
            'name' => $user['first_name'] . ' ' . $user['last_name']
        ]
    ]);

} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Server error: ' . $e->getMessage()]);
}
?>