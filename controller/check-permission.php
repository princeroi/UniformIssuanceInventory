<?php
// controller/check-permission.php
// Use this in your API endpoints to verify permissions

session_start();
header('Content-Type: application/json');

function checkPermission($requiredPage) {
    if (!isset($_SESSION['logged_in']) || $_SESSION['logged_in'] !== true) {
        return ['allowed' => false, 'message' => 'Not authenticated'];
    }
    
    $role = strtolower($_SESSION['role_name'] ?? '');
    
    // Define permissions for each role
    $rolePermissions = [
        'administrator' => [
            'dashboard', 'pos', 'issuance', 'deliveries', 
            'inventory', 'users', 'reports', 'history', 'settings'
        ],
        'manager' => [
            'dashboard', 'pos', 'issuance', 'deliveries', 
            'inventory', 'users', 'reports', 'history'
        ],
        'supervisor' => [
            'dashboard', 'pos', 'issuance', 'deliveries', 
            'inventory', 'reports', 'history'
        ],
        'recruiter' => ['pos']
    ];
    
    $allowedPages = $rolePermissions[$role] ?? [];
    
    if (in_array($requiredPage, $allowedPages)) {
        return ['allowed' => true];
    }
    
    return [
        'allowed' => false, 
        'message' => "Access denied. Your role ($role) does not have permission to access $requiredPage"
    ];
}

// If called directly with a page parameter
if (isset($_GET['page'])) {
    $result = checkPermission($_GET['page']);
    echo json_encode($result);
} else {
    echo json_encode(['error' => 'No page specified']);
}
?>