<?php
// controller/logout.php
// Destroys the session and clears all session data

session_start();

// Destroy all session data
session_unset();
session_destroy();

// Clear session cookie
if (isset($_COOKIE[session_name()])) {
    setcookie(session_name(), '', time() - 3600, '/');
}

// Return success response (for AJAX calls)
header('Content-Type: application/json');
echo json_encode([
    'success' => true,
    'message' => 'Logged out successfully'
]);
exit;
?>