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
        
        $stmt = $pdo->prepare("
            INSERT INTO roles (role_name, description, created_at) 
            VALUES (?, ?, NOW())
        ");
        $stmt->execute([$roleName, $description]);
        
        $newId = $pdo->lastInsertId();
        
        // Get the newly created role
        $stmt = $pdo->prepare("SELECT * FROM roles WHERE id = ?");
        $stmt->execute([$newId]);
        $newRole = $stmt->fetch(PDO::FETCH_ASSOC);
        
        sendResponse(true, 'Role added successfully', $newRole);
        
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
        
        $stmt = $pdo->prepare("DELETE FROM roles WHERE id = ?");
        $stmt->execute([$id]);
        
        sendResponse(true, 'Role "' . $role['role_name'] . '" deleted successfully');
        
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
?>