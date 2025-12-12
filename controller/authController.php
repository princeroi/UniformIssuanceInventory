<?php
require 'config.php';
header('Content-Type: application/json');
session_start();

// Include encryption constants from your config
define('ENCRYPTION_KEY', 'zO2fC1Z4j3hfPjs7qf8G1e3u5Oqqr3vJvZ1jVtZy8gM=');
define('ENCRYPTION_METHOD', 'AES-256-CBC');

// Get POST data
$data = json_decode(file_get_contents('php://input'), true);
$user_id = $data['username'] ?? ''; // using input field for user_id
$password = $data['password'] ?? '';

try {
    // Fetch user by user_id
    $stmt = $pdo->prepare("SELECT * FROM users WHERE user_id = :user_id LIMIT 1");
    $stmt->execute(['user_id' => $user_id]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($user) {
        // Decrypt password from DB
        $decryptedPassword = decryptPassword($user['password']);

        if ($password === $decryptedPassword) {
            $_SESSION['user_id'] = $user['user_id'];
            $_SESSION['name'] = $user['first_name'] . ' ' . $user['last_name'];
            echo json_encode(['success' => true, 'message' => 'Login successful!']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Invalid user ID or password.']);
        }
    } else {
        echo json_encode(['success' => false, 'message' => 'Invalid user ID or password.']);
    }
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}

// Decrypt function (use the one from your config)
function decryptPassword($encryptedPassword) {
    $parts = explode('::', base64_decode($encryptedPassword), 2);
    if (count($parts) !== 2) return false;
    list($encrypted_data, $iv) = $parts;
    return openssl_decrypt($encrypted_data, ENCRYPTION_METHOD, ENCRYPTION_KEY, 0, $iv);
}
