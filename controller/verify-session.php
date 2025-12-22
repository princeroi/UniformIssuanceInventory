<?php
// controller/verify-session.php
session_start();

header('Content-Type: application/json');

if (isset($_SESSION['logged_in']) && $_SESSION['logged_in'] === true) {
    echo json_encode([
        'valid' => true,
        'user' => [
            'user_id' => $_SESSION['user_id'] ?? '',
            'name' => $_SESSION['name'] ?? '',
            'role_name' => $_SESSION['role_name'] ?? '',
            'role_id' => $_SESSION['role_id'] ?? ''
        ]
    ]);
} else {
    echo json_encode(['valid' => false]);
}
?>