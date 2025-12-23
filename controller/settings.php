<?php
// Prevent any output before JSON response
ob_start();

// Error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

// Try different paths for config.php
$config_paths = [
    __DIR__ . '/config.php',
    __DIR__ . '/../config/config.php',
    __DIR__ . '/../includes/config.php',
    dirname(__DIR__) . '/config.php',
];

$config_loaded = false;
foreach ($config_paths as $config_path) {
    if (file_exists($config_path)) {
        require_once $config_path;
        $config_loaded = true;
        break;
    }
}

if (!$config_loaded) {
    ob_clean();
    header('Content-Type: application/json');
    echo json_encode([
        'success' => false,
        'message' => 'Configuration file not found. Searched paths: ' . implode(', ', $config_paths)
    ]);
    exit;
}

session_start();

// Clear any output buffer and set JSON header
ob_clean();
header('Content-Type: application/json');

function sendResponse($success, $message, $data = null) {
    // Ensure clean output
    if (ob_get_length()) ob_clean();
    
    echo json_encode([
        'success' => $success,
        'message' => $message,
        'data' => $data
    ], JSON_PRETTY_PRINT);
    exit;
}

try {
    // Database connection
    if (!isset($dsn) || !isset($user) || !isset($pass)) {
        sendResponse(false, "Database configuration variables not found in config.php");
    }
    
    $pdo = new PDO($dsn, $user, $pass, $options);
    
    $action = $_GET['action'] ?? $_POST['action'] ?? '';
    
    if (empty($action)) {
        sendResponse(false, "No action specified");
    }
    
    switch($action) {
        case 'getRoles':
            getRoles($pdo);
            break;
            
        case 'getDepartments':
            getDepartments($pdo);
            break;
            
        case 'addRole':
            addRole($pdo);
            break;
            
        case 'updateRole':
            updateRole($pdo);
            break;
            
        case 'deleteRole':
            deleteRole($pdo);
            break;
            
        case 'addDepartment':
            addDepartment($pdo);
            break;
            
        case 'updateDepartment':
            updateDepartment($pdo);
            break;
            
        case 'deleteDepartment':
            deleteDepartment($pdo);
            break;
            
        // Role Permissions
        case 'getRolePermissions':
            getRolePermissions($pdo);
            break;
            
        case 'saveRolePermissions':
            saveRolePermissions($pdo);
            break;

        // User Permissions
        case 'getUserPermissions':
            getUserPermissions($pdo);
            break;
            
        case 'saveUserPermissions':
            saveUserPermissions($pdo);
            break;
            
        case 'resetUserPermissions':
            resetUserPermissions($pdo);
            break;
            
        default:
            sendResponse(false, "Invalid action: " . $action);
            break;
    }
    
} catch (PDOException $e) {
    sendResponse(false, "Database connection error: " . $e->getMessage());
} catch (Exception $e) {
    sendResponse(false, "Server error: " . $e->getMessage());
}

// ==================== ROLES FUNCTIONS ====================

function getRoles($pdo) {
    try {
        $stmt = $pdo->prepare("SELECT * FROM roles ORDER BY created_at DESC");
        $stmt->execute();
        $roles = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        sendResponse(true, 'Roles retrieved successfully', $roles);
        
    } catch (PDOException $e) {
        sendResponse(false, 'Failed to retrieve roles: ' . $e->getMessage());
    }
}

function addRole($pdo) {
    try {
        $roleName = trim($_POST['role_name'] ?? '');
        $description = trim($_POST['description'] ?? '');
        
        if (empty($roleName)) {
            sendResponse(false, 'Role name is required');
        }
        
        if (empty($description)) {
            sendResponse(false, 'Description is required');
        }
        
        // Check if role already exists
        $stmt = $pdo->prepare("SELECT id FROM roles WHERE role_name = ?");
        $stmt->execute([$roleName]);
        if ($stmt->fetch()) {
            sendResponse(false, 'A role with this name already exists');
        }
        
        // Start transaction
        $pdo->beginTransaction();
        
        try {
            // Insert role
            $stmt = $pdo->prepare("
                INSERT INTO roles (role_name, description, created_at) 
                VALUES (?, ?, NOW())
            ");
            $stmt->execute([$roleName, $description]);
            
            $newId = $pdo->lastInsertId();
            
            // Create default permissions for all pages
            $pages = ['dashboard', 'users', 'pos', 'inventory', 'issuance', 'deliveries', 'reports', 'history', 'settings'];
            
            $stmt = $pdo->prepare("
                INSERT INTO role_permissions 
                (role_id, page_name, can_view, can_add, can_edit, can_delete, created_at) 
                VALUES (?, ?, 0, 0, 0, 0, NOW())
            ");
            
            foreach ($pages as $page) {
                $stmt->execute([$newId, $page]);
            }
            
            $pdo->commit();
            
            // Get the newly created role
            $stmt = $pdo->prepare("SELECT * FROM roles WHERE id = ?");
            $stmt->execute([$newId]);
            $newRole = $stmt->fetch(PDO::FETCH_ASSOC);
            
            sendResponse(true, 'Role added successfully', $newRole);
            
        } catch (Exception $e) {
            $pdo->rollBack();
            throw $e;
        }
        
    } catch (PDOException $e) {
        sendResponse(false, 'Failed to add role: ' . $e->getMessage());
    }
}

function updateRole($pdo) {
    try {
        $id = $_POST['id'] ?? '';
        $roleName = trim($_POST['role_name'] ?? '');
        $description = trim($_POST['description'] ?? '');
        
        if (empty($id)) {
            sendResponse(false, 'Role ID is required');
        }
        
        if (empty($roleName)) {
            sendResponse(false, 'Role name is required');
        }
        
        if (empty($description)) {
            sendResponse(false, 'Description is required');
        }
        
        // Check if role exists
        $stmt = $pdo->prepare("SELECT id FROM roles WHERE id = ?");
        $stmt->execute([$id]);
        if (!$stmt->fetch()) {
            sendResponse(false, 'Role not found');
        }
        
        // Check if another role has the same name
        $stmt = $pdo->prepare("SELECT id FROM roles WHERE role_name = ? AND id != ?");
        $stmt->execute([$roleName, $id]);
        if ($stmt->fetch()) {
            sendResponse(false, 'Another role with this name already exists');
        }
        
        $stmt = $pdo->prepare("
            UPDATE roles 
            SET role_name = ?, description = ? 
            WHERE id = ?
        ");
        $stmt->execute([$roleName, $description, $id]);
        
        // Get the updated role
        $stmt = $pdo->prepare("SELECT * FROM roles WHERE id = ?");
        $stmt->execute([$id]);
        $updatedRole = $stmt->fetch(PDO::FETCH_ASSOC);
        
        sendResponse(true, 'Role updated successfully', $updatedRole);
        
    } catch (PDOException $e) {
        sendResponse(false, 'Failed to update role: ' . $e->getMessage());
    }
}

function deleteRole($pdo) {
    try {
        $id = $_POST['id'] ?? $_GET['id'] ?? '';
        
        if (empty($id)) {
            sendResponse(false, 'Role ID is required');
        }
        
        // Check if role exists
        $stmt = $pdo->prepare("SELECT role_name FROM roles WHERE id = ?");
        $stmt->execute([$id]);
        $role = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$role) {
            sendResponse(false, 'Role not found');
        }
        
        // Check if role is being used by any users
        $tableCheck = $pdo->query("SHOW TABLES LIKE 'users'");
        if ($tableCheck->rowCount() > 0) {
            $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM users WHERE role_id = ?");
            $stmt->execute([$id]);
            $count = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
            
            if ($count > 0) {
                sendResponse(false, 'Cannot delete role: It is assigned to ' . $count . ' user(s)');
            }
        }
        
        // Start transaction
        $pdo->beginTransaction();
        
        try {
            // Delete role permissions first
            $stmt = $pdo->prepare("DELETE FROM role_permissions WHERE role_id = ?");
            $stmt->execute([$id]);
            
            // Delete role
            $stmt = $pdo->prepare("DELETE FROM roles WHERE id = ?");
            $stmt->execute([$id]);
            
            $pdo->commit();
            
            sendResponse(true, 'Role "' . $role['role_name'] . '" deleted successfully');
            
        } catch (Exception $e) {
            $pdo->rollBack();
            throw $e;
        }
        
    } catch (PDOException $e) {
        sendResponse(false, 'Failed to delete role: ' . $e->getMessage());
    }
}

// ==================== DEPARTMENTS FUNCTIONS ====================

function getDepartments($pdo) {
    try {
        $stmt = $pdo->prepare("SELECT * FROM departments ORDER BY created_at DESC");
        $stmt->execute();
        $departments = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        sendResponse(true, 'Departments retrieved successfully', $departments);
        
    } catch (PDOException $e) {
        sendResponse(false, 'Failed to retrieve departments: ' . $e->getMessage());
    }
}

function addDepartment($pdo) {
    try {
        $departmentName = trim($_POST['department_name'] ?? '');
        
        if (empty($departmentName)) {
            sendResponse(false, 'Department name is required');
        }
        
        // Check if department already exists
        $stmt = $pdo->prepare("SELECT id FROM departments WHERE department_name = ?");
        $stmt->execute([$departmentName]);
        if ($stmt->fetch()) {
            sendResponse(false, 'A department with this name already exists');
        }
        
        $stmt = $pdo->prepare("
            INSERT INTO departments (department_name, created_at) 
            VALUES (?, NOW())
        ");
        $stmt->execute([$departmentName]);
        
        $newId = $pdo->lastInsertId();
        
        // Get the newly created department
        $stmt = $pdo->prepare("SELECT * FROM departments WHERE id = ?");
        $stmt->execute([$newId]);
        $newDepartment = $stmt->fetch(PDO::FETCH_ASSOC);
        
        sendResponse(true, 'Department added successfully', $newDepartment);
        
    } catch (PDOException $e) {
        sendResponse(false, 'Failed to add department: ' . $e->getMessage());
    }
}

function updateDepartment($pdo) {
    try {
        $id = $_POST['id'] ?? '';
        $departmentName = trim($_POST['department_name'] ?? '');
        
        if (empty($id)) {
            sendResponse(false, 'Department ID is required');
        }
        
        if (empty($departmentName)) {
            sendResponse(false, 'Department name is required');
        }
        
        // Check if department exists
        $stmt = $pdo->prepare("SELECT id FROM departments WHERE id = ?");
        $stmt->execute([$id]);
        if (!$stmt->fetch()) {
            sendResponse(false, 'Department not found');
        }
        
        // Check if another department has the same name
        $stmt = $pdo->prepare("SELECT id FROM departments WHERE department_name = ? AND id != ?");
        $stmt->execute([$departmentName, $id]);
        if ($stmt->fetch()) {
            sendResponse(false, 'Another department with this name already exists');
        }
        
        $stmt = $pdo->prepare("
            UPDATE departments 
            SET department_name = ? 
            WHERE id = ?
        ");
        $stmt->execute([$departmentName, $id]);
        
        // Get the updated department
        $stmt = $pdo->prepare("SELECT * FROM departments WHERE id = ?");
        $stmt->execute([$id]);
        $updatedDepartment = $stmt->fetch(PDO::FETCH_ASSOC);
        
        sendResponse(true, 'Department updated successfully', $updatedDepartment);
        
    } catch (PDOException $e) {
        sendResponse(false, 'Failed to update department: ' . $e->getMessage());
    }
}

function deleteDepartment($pdo) {
    try {
        $id = $_POST['id'] ?? $_GET['id'] ?? '';
        
        if (empty($id)) {
            sendResponse(false, 'Department ID is required');
        }
        
        // Check if department exists
        $stmt = $pdo->prepare("SELECT department_name FROM departments WHERE id = ?");
        $stmt->execute([$id]);
        $department = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$department) {
            sendResponse(false, 'Department not found');
        }
        
        // Check if department is being used by any employees
        $tableCheck = $pdo->query("SHOW TABLES LIKE 'employees'");
        if ($tableCheck->rowCount() > 0) {
            $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM employees WHERE department_id = ?");
            $stmt->execute([$id]);
            $count = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
            
            if ($count > 0) {
                sendResponse(false, 'Cannot delete department: It is assigned to ' . $count . ' employee(s)');
            }
        }
        
        $stmt = $pdo->prepare("DELETE FROM departments WHERE id = ?");
        $stmt->execute([$id]);
        
        sendResponse(true, 'Department "' . $department['department_name'] . '" deleted successfully');
        
    } catch (PDOException $e) {
        sendResponse(false, 'Failed to delete department: ' . $e->getMessage());
    }
}

// ==================== ROLE PERMISSIONS FUNCTIONS ====================

function getRolePermissions($pdo) {
    try {
        $roleId = $_GET['role_id'] ?? '';
        
        if (empty($roleId)) {
            sendResponse(false, 'Role ID is required');
        }
        
        // Verify role exists
        $stmt = $pdo->prepare("SELECT id FROM roles WHERE id = ?");
        $stmt->execute([$roleId]);
        if (!$stmt->fetch()) {
            sendResponse(false, 'Role not found');
        }
        
        // Get permissions for this role
        $stmt = $pdo->prepare("
            SELECT page_name, can_view, can_add, can_edit, can_delete 
            FROM role_permissions 
            WHERE role_id = ?
            ORDER BY page_name
        ");
        $stmt->execute([$roleId]);
        $permissions = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        sendResponse(true, 'Role permissions retrieved successfully', $permissions);
        
    } catch (PDOException $e) {
        sendResponse(false, 'Failed to retrieve role permissions: ' . $e->getMessage());
    }
}

function saveRolePermissions($pdo) {
    try {
        $roleId = $_POST['role_id'] ?? '';
        $permissionsJson = $_POST['permissions'] ?? '';
        
        if (empty($roleId)) {
            sendResponse(false, 'Role ID is required');
        }
        
        if (empty($permissionsJson)) {
            sendResponse(false, 'Permissions data is required');
        }
        
        $permissions = json_decode($permissionsJson, true);
        
        if (!is_array($permissions)) {
            sendResponse(false, 'Invalid permissions format');
        }
        
        // Verify role exists
        $stmt = $pdo->prepare("SELECT id FROM roles WHERE id = ?");
        $stmt->execute([$roleId]);
        if (!$stmt->fetch()) {
            sendResponse(false, 'Role not found');
        }
        
        // Start transaction
        $pdo->beginTransaction();
        
        try {
            // Delete existing permissions for this role
            $stmt = $pdo->prepare("DELETE FROM role_permissions WHERE role_id = ?");
            $stmt->execute([$roleId]);
            
            // Insert new permissions
            $stmt = $pdo->prepare("
                INSERT INTO role_permissions 
                (role_id, page_name, can_view, can_add, can_edit, can_delete, created_at) 
                VALUES (?, ?, ?, ?, ?, ?, NOW())
            ");
            
            foreach ($permissions as $page => $perms) {
                $stmt->execute([
                    $roleId,
                    $page,
                    $perms['can_view'] ?? 0,
                    $perms['can_add'] ?? 0,
                    $perms['can_edit'] ?? 0,
                    $perms['can_delete'] ?? 0
                ]);
            }
            
            $pdo->commit();
            sendResponse(true, 'Role permissions saved successfully');
            
        } catch (Exception $e) {
            $pdo->rollBack();
            throw $e;
        }
        
    } catch (PDOException $e) {
        sendResponse(false, 'Failed to save role permissions: ' . $e->getMessage());
    }
}

// ==================== USER PERMISSIONS FUNCTIONS ====================

function getUserPermissions($pdo) {
    try {
        $userId = $_GET['user_id'] ?? '';
        
        if (empty($userId)) {
            sendResponse(false, 'User ID is required');
        }
        
        // Get user's role
        $stmt = $pdo->prepare("SELECT role_id FROM users WHERE id = ?");
        $stmt->execute([$userId]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$user) {
            sendResponse(false, 'User not found');
        }
        
        // Get role default permissions
        $stmt = $pdo->prepare("
            SELECT page_name, can_view, can_add, can_edit, can_delete 
            FROM role_permissions 
            WHERE role_id = ?
            ORDER BY page_name
        ");
        $stmt->execute([$user['role_id']]);
        $rolePermissions = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Get user custom permissions
        $stmt = $pdo->prepare("
            SELECT page_name, can_view, can_add, can_edit, can_delete, use_custom 
            FROM user_permissions 
            WHERE user_id = ?
            ORDER BY page_name
        ");
        $stmt->execute([$userId]);
        $userCustomPermissions = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Create a map for easy lookup
        $customMap = [];
        foreach ($userCustomPermissions as $perm) {
            $customMap[$perm['page_name']] = $perm;
        }
        
        // Combine permissions (custom overrides role if use_custom = 1)
        $effectivePermissions = [];
        foreach ($rolePermissions as $rolePerm) {
            $page = $rolePerm['page_name'];
            
            if (isset($customMap[$page]) && $customMap[$page]['use_custom'] == 1) {
                // Use custom permissions
                $effectivePermissions[] = [
                    'page_name' => $page,
                    'can_view' => $customMap[$page]['can_view'],
                    'can_add' => $customMap[$page]['can_add'],
                    'can_edit' => $customMap[$page]['can_edit'],
                    'can_delete' => $customMap[$page]['can_delete'],
                    'is_custom' => true,
                    'role_default' => $rolePerm
                ];
            } else {
                // Use role default
                $effectivePermissions[] = [
                    'page_name' => $page,
                    'can_view' => $rolePerm['can_view'],
                    'can_add' => $rolePerm['can_add'],
                    'can_edit' => $rolePerm['can_edit'],
                    'can_delete' => $rolePerm['can_delete'],
                    'is_custom' => false,
                    'role_default' => $rolePerm
                ];
            }
        }
        
        sendResponse(true, 'User permissions retrieved successfully', [
            'permissions' => $effectivePermissions,
            'role_id' => $user['role_id']
        ]);
        
    } catch (PDOException $e) {
        sendResponse(false, 'Failed to retrieve user permissions: ' . $e->getMessage());
    }
}

function saveUserPermissions($pdo) {
    try {
        $userId = $_POST['user_id'] ?? '';
        $permissionsJson = $_POST['permissions'] ?? '';
        
        if (empty($userId)) {
            sendResponse(false, 'User ID is required');
        }
        
        if (empty($permissionsJson)) {
            sendResponse(false, 'Permissions data is required');
        }
        
        $permissions = json_decode($permissionsJson, true);
        
        if (!is_array($permissions)) {
            sendResponse(false, 'Invalid permissions format');
        }
        
        // Verify user exists
        $stmt = $pdo->prepare("SELECT id FROM users WHERE id = ?");
        $stmt->execute([$userId]);
        if (!$stmt->fetch()) {
            sendResponse(false, 'User not found');
        }
        
        // Start transaction
        $pdo->beginTransaction();
        
        try {
            // Delete existing custom permissions for this user
            $stmt = $pdo->prepare("DELETE FROM user_permissions WHERE user_id = ?");
            $stmt->execute([$userId]);
            
            // Insert new custom permissions
            $stmt = $pdo->prepare("
                INSERT INTO user_permissions 
                (user_id, page_name, can_view, can_add, can_edit, can_delete, use_custom) 
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ");
            
            foreach ($permissions as $page => $perms) {
                // Only save if use_custom is true
                if (isset($perms['use_custom']) && $perms['use_custom']) {
                    $stmt->execute([
                        $userId,
                        $page,
                        $perms['can_view'] ?? 0,
                        $perms['can_add'] ?? 0,
                        $perms['can_edit'] ?? 0,
                        $perms['can_delete'] ?? 0,
                        1 // use_custom
                    ]);
                }
            }
            
            $pdo->commit();
            sendResponse(true, 'User permissions saved successfully');
            
        } catch (Exception $e) {
            $pdo->rollBack();
            throw $e;
        }
        
    } catch (PDOException $e) {
        sendResponse(false, 'Failed to save user permissions: ' . $e->getMessage());
    }
}

function resetUserPermissions($pdo) {
    try {
        $userId = $_POST['user_id'] ?? '';
        
        if (empty($userId)) {
            sendResponse(false, 'User ID is required');
        }
        
        // Delete all custom permissions for this user
        $stmt = $pdo->prepare("DELETE FROM user_permissions WHERE user_id = ?");
        $stmt->execute([$userId]);
        
        sendResponse(true, 'User permissions reset to role defaults');
        
    } catch (PDOException $e) {
        sendResponse(false, 'Failed to reset user permissions: ' . $e->getMessage());
    }
}

?>