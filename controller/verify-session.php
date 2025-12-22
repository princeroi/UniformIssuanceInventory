<?php
// controller/verify-session.php
// This checks if the PHP session is still valid

session_start();

header('Content-Type: application/json');

// Check if session is valid
if (isset($_SESSION['logged_in']) && $_SESSION['logged_in'] === true) {
    echo json_encode([
        'valid' => true,
        'user' => [
            'user_id' => $_SESSION['user_id'] ?? '',
            'name' => $_SESSION['name'] ?? '',
            'first_name' => $_SESSION['first_name'] ?? '',
            'last_name' => $_SESSION['last_name'] ?? ''
        ]
    ]);
} else {
    echo json_encode([
        'valid' => false,
        'message' => 'Session expired or invalid'
    ]);
}
?>