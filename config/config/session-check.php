<?php
// config/session-check.php
// Include this at the top of index.html or any protected page

session_start();

// Check if user is logged in
if (!isset($_SESSION['logged_in']) || $_SESSION['logged_in'] !== true) {
    // Redirect to login page
    header('Location: login.html');
    exit;
}

// Optional: Session timeout check (30 minutes)
if (isset($_SESSION['last_activity']) && (time() - $_SESSION['last_activity'] > 1800)) {
    session_unset();
    session_destroy();
    header('Location: login.html');
    exit;
}

// Update last activity time
$_SESSION['last_activity'] = time();
?>