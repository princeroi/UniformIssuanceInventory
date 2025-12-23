<?php
require 'config.php';
header('Content-Type: application/json');

try {
    $pdo = new PDO($dsn, $user, $pass, $options);

    $action = $_GET['action'] ?? $_POST['action'] ?? '';

    switch($action) {
        case 'fetchUsers':
            $users = fetchAllUsers($pdo);
            sendResponse(true, 'Users fetched successfully', $users);
            break;

        case 'getRoles':
            getRoles($pdo);
            break;

        case 'getDepartments':
            getDepartments($pdo);
            break;

        case 'createUser':
            createUser($pdo);
            break;

        case 'getUserById':
            $id = $_GET['id'] ?? null;
            if (!$id) {
                sendResponse(false, 'User ID is required');
            }
            $user = getUserById($pdo, $id);
            if ($user) {
                echo json_encode(['success' => true, 'user' => $user]);
            } else {
                sendResponse(false, 'User not found');
            }
            break;

        case 'updateUser':
            updateUser($pdo);
            break;

        case 'toggleStatus':
            toggleStatus($pdo);
            break;

        case 'deleteUser':
            deleteUser($pdo);
            break;

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
            sendResponse(false, 'Invalid action');
            break;
    }

} catch (PDOException $e) {
    sendResponse(false, 'Database error: ' . $e->getMessage());
}

// Get all roles
function getRoles($pdo) {
    try {
        $stmt = $pdo->query("
            SELECT id, role_name, description, created_at 
            FROM roles 
            ORDER BY role_name ASC
        ");
        
        $roles = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'message' => 'Roles fetched successfully',
            'roles' => $roles
        ]);
        exit;
        
    } catch (PDOException $e) {
        sendResponse(false, 'Failed to fetch roles: ' . $e->getMessage());
    }
}

// Get all departments
function getDepartments($pdo) {
    try {
        $stmt = $pdo->query("
            SELECT id, department_name, created_at 
            FROM departments 
            ORDER BY department_name ASC
        ");
        
        $departments = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'message' => 'Departments fetched successfully',
            'departments' => $departments
        ]);
        exit;
        
    } catch (PDOException $e) {
        sendResponse(false, 'Failed to fetch departments: ' . $e->getMessage());
    }
}

// Fetch all users
function fetchAllUsers($pdo) {
    $stmt = $pdo->query("
        SELECT 
            u.id,
            u.first_name,
            u.last_name,
            CONCAT(u.first_name, ' ', u.last_name) AS full_name,
            u.user_id,
            u.email,
            u.role_id,
            u.department_id,
            r.role_name,
            d.department_name,
            u.status,
            u.last_login
        FROM users u
        LEFT JOIN roles r ON u.role_id = r.id
        LEFT JOIN departments d ON u.department_id = d.id
        ORDER BY u.id DESC
    ");

    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

// Get user by ID
function getUserById($pdo, $id) {
    $stmt = $pdo->prepare("
        SELECT 
            u.id,
            u.first_name,
            u.last_name,
            u.user_id,
            u.email,
            u.password,
            u.role_id,
            u.department_id,
            u.status,
            r.role_name,
            d.department_name
        FROM users u
        LEFT JOIN roles r ON u.role_id = r.id
        LEFT JOIN departments d ON u.department_id = d.id
        WHERE u.id = ?
    ");
    
    $stmt->execute([$id]);
    return $stmt->fetch(PDO::FETCH_ASSOC);
}

// Get user permissions with role defaults
function getUserPermissions($pdo) {
    $userId = $_GET['user_id'] ?? null;
    
    if (!$userId) {
        sendResponse(false, 'User ID is required');
    }
    
    try {
        // Get user's role
        $stmt = $pdo->prepare("SELECT role_id FROM users WHERE id = ?");
        $stmt->execute([$userId]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$user) {
            sendResponse(false, 'User not found');
        }
        
        $roleId = $user['role_id'];
        
        // Get role permissions (defaults)
        $stmt = $pdo->prepare("
            SELECT page_name, can_view, can_add, can_edit, can_delete
            FROM role_permissions
            WHERE role_id = ?
        ");
        $stmt->execute([$roleId]);
        $rolePermissions = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Get user permissions
        $stmt = $pdo->prepare("
            SELECT page_name, can_view, can_add, can_edit, can_delete, use_custom
            FROM user_permissions
            WHERE user_id = ?
        ");
        $stmt->execute([$userId]);
        $userPermissions = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Merge permissions
        $permissions = [];
        foreach ($rolePermissions as $rolePerm) {
            $userPerm = null;
            foreach ($userPermissions as $up) {
                if ($up['page_name'] === $rolePerm['page_name']) {
                    $userPerm = $up;
                    break;
                }
            }
            
            if ($userPerm) {
                $permissions[] = [
                    'page_name' => $rolePerm['page_name'],
                    'can_view' => $userPerm['use_custom'] ? $userPerm['can_view'] : $rolePerm['can_view'],
                    'can_add' => $userPerm['use_custom'] ? $userPerm['can_add'] : $rolePerm['can_add'],
                    'can_edit' => $userPerm['use_custom'] ? $userPerm['can_edit'] : $rolePerm['can_edit'],
                    'can_delete' => $userPerm['use_custom'] ? $userPerm['can_delete'] : $rolePerm['can_delete'],
                    'is_custom' => $userPerm['use_custom'] == 1,
                    'role_default' => [
                        'can_view' => $rolePerm['can_view'],
                        'can_add' => $rolePerm['can_add'],
                        'can_edit' => $rolePerm['can_edit'],
                        'can_delete' => $rolePerm['can_delete']
                    ]
                ];
            } else {
                // User permission doesn't exist, use role default
                $permissions[] = [
                    'page_name' => $rolePerm['page_name'],
                    'can_view' => $rolePerm['can_view'],
                    'can_add' => $rolePerm['can_add'],
                    'can_edit' => $rolePerm['can_edit'],
                    'can_delete' => $rolePerm['can_delete'],
                    'is_custom' => false,
                    'role_default' => [
                        'can_view' => $rolePerm['can_view'],
                        'can_add' => $rolePerm['can_add'],
                        'can_edit' => $rolePerm['can_edit'],
                        'can_delete' => $rolePerm['can_delete']
                    ]
                ];
            }
        }
        
        echo json_encode([
            'success' => true,
            'message' => 'Permissions fetched successfully',
            'data' => [
                'permissions' => $permissions
            ]
        ]);
        exit;
        
    } catch (PDOException $e) {
        sendResponse(false, 'Failed to fetch permissions: ' . $e->getMessage());
    }
}

// Save user permissions - WITH UPSERT (INSERT OR UPDATE)
function saveUserPermissions($pdo) {
    $userId = $_POST['user_id'] ?? null;
    $permissionsJson = $_POST['permissions'] ?? null;
    
    if (!$userId || !$permissionsJson) {
        sendResponse(false, 'User ID and permissions are required');
    }
    
    $permissions = json_decode($permissionsJson, true);
    
    if (!is_array($permissions)) {
        sendResponse(false, 'Invalid permissions format');
    }
    
    try {
        // Get user's role
        $stmt = $pdo->prepare("SELECT role_id FROM users WHERE id = ?");
        $stmt->execute([$userId]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$user) {
            sendResponse(false, 'User not found');
        }
        
        $roleId = $user['role_id'];
        
        $pdo->beginTransaction();
        
        // Use INSERT ... ON DUPLICATE KEY UPDATE or check and insert/update
        // This ensures the row exists before updating
        
        foreach ($permissions as $pageName => $perm) {
            // Convert use_custom to integer
            $useCustom = 0;
            if (isset($perm['use_custom'])) {
                if ($perm['use_custom'] === true || 
                    $perm['use_custom'] === 1 || 
                    $perm['use_custom'] === "1" || 
                    $perm['use_custom'] === 'true') {
                    $useCustom = 1;
                }
            }
            
            // Convert checkbox values to integer: checked = 1, unchecked = 0
            $canView = isset($perm['can_view']) ? (int)$perm['can_view'] : 0;
            $canAdd = isset($perm['can_add']) ? (int)$perm['can_add'] : 0;
            $canEdit = isset($perm['can_edit']) ? (int)$perm['can_edit'] : 0;
            $canDelete = isset($perm['can_delete']) ? (int)$perm['can_delete'] : 0;
            
            // Check if permission row exists
            $checkStmt = $pdo->prepare("
                SELECT COUNT(*) as count 
                FROM user_permissions 
                WHERE user_id = ? AND page_name = ?
            ");
            $checkStmt->execute([$userId, $pageName]);
            $exists = $checkStmt->fetch(PDO::FETCH_ASSOC)['count'] > 0;
            
            if ($exists) {
                // UPDATE existing row
                $stmt = $pdo->prepare("
                    UPDATE user_permissions 
                    SET can_view = ?, 
                        can_add = ?, 
                        can_edit = ?, 
                        can_delete = ?, 
                        use_custom = ?,
                        updated_at = NOW()
                    WHERE user_id = ? AND page_name = ?
                ");
                
                $stmt->execute([
                    $canView,
                    $canAdd,
                    $canEdit,
                    $canDelete,
                    $useCustom,
                    $userId,
                    $pageName
                ]);
            } else {
                // INSERT new row
                $stmt = $pdo->prepare("
                    INSERT INTO user_permissions 
                    (user_id, page_name, can_view, can_add, can_edit, can_delete, use_custom, created_at, updated_at) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
                ");
                
                $stmt->execute([
                    $userId,
                    $pageName,
                    $canView,
                    $canAdd,
                    $canEdit,
                    $canDelete,
                    $useCustom
                ]);
            }
        }
        
        $pdo->commit();
        
        sendResponse(true, 'User permissions updated successfully');
        
    } catch (PDOException $e) {
        $pdo->rollBack();
        sendResponse(false, 'Failed to save permissions: ' . $e->getMessage());
    }
}

// Reset user permissions to role defaults
function resetUserPermissions($pdo) {
    $userId = $_POST['user_id'] ?? null;
    
    if (!$userId) {
        sendResponse(false, 'User ID is required');
    }
    
    try {
        // Get user's role
        $stmt = $pdo->prepare("SELECT role_id FROM users WHERE id = ?");
        $stmt->execute([$userId]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$user) {
            sendResponse(false, 'User not found');
        }
        
        $roleId = $user['role_id'];
        
        // Reset all permissions to use_custom = 0
        $stmt = $pdo->prepare("
            UPDATE user_permissions 
            SET use_custom = 0,
                updated_at = NOW()
            WHERE user_id = ?
        ");
        $stmt->execute([$userId]);
        
        // Re-initialize permissions from role
        initializeUserPermissions($pdo, $userId, $roleId);
        
        sendResponse(true, 'User permissions have been reset to role defaults');
        
    } catch (PDOException $e) {
        sendResponse(false, 'Failed to reset permissions: ' . $e->getMessage());
    }
}

// Initialize user permissions based on role
function initializeUserPermissions($pdo, $userId, $roleId) {
    try {
        // Get all role permissions for this role
        $stmt = $pdo->prepare("
            SELECT page_name, can_view, can_add, can_edit, can_delete 
            FROM role_permissions 
            WHERE role_id = ?
        ");
        $stmt->execute([$roleId]);
        $rolePermissions = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Delete existing user permissions (in case of role change)
        $stmt = $pdo->prepare("DELETE FROM user_permissions WHERE user_id = ?");
        $stmt->execute([$userId]);

        // Insert default permissions for each page (use_custom = 0 means using role defaults)
        $stmt = $pdo->prepare("
            INSERT INTO user_permissions 
            (user_id, page_name, can_view, can_add, can_edit, can_delete, use_custom, created_at) 
            VALUES (?, ?, ?, ?, ?, ?, 0, NOW())
        ");

        foreach ($rolePermissions as $perm) {
            $stmt->execute([
                $userId,
                $perm['page_name'],
                $perm['can_view'],
                $perm['can_add'],
                $perm['can_edit'],
                $perm['can_delete']
            ]);
        }

        return true;
    } catch (PDOException $e) {
        error_log('Error initializing user permissions: ' . $e->getMessage());
        return false;
    }
}

// Create a new user
function createUser($pdo) {
    $firstName = trim($_POST['firstName'] ?? '');
    $lastName = trim($_POST['lastName'] ?? '');
    $username = trim($_POST['username'] ?? '');
    $email = trim($_POST['email'] ?? '');
    $roleId = $_POST['roleId'] ?? null;
    $departmentId = $_POST['departmentId'] ?? null;
    $status = $_POST['status'] ?? 'Active';

    // Validation
    $errors = [];
    if (!$firstName) $errors[] = 'First name is required';
    if (!$lastName) $errors[] = 'Last name is required';
    if (!$username) $errors[] = 'User ID is required';
    if (!$email) $errors[] = 'Email is required';
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) $errors[] = 'Invalid email format';
    if (!$roleId) $errors[] = 'Role is required';
    if (!$departmentId) $errors[] = 'Department is required';

    if (!empty($errors)) {
        sendResponse(false, implode(', ', $errors));
    }

    // Check for duplicate username
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM users WHERE user_id = ?");
    $stmt->execute([$username]);
    if ($stmt->fetchColumn() > 0) {
        sendResponse(false, 'User ID already exists');
    }

    // Check for duplicate email
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM users WHERE email = ?");
    $stmt->execute([$email]);
    if ($stmt->fetchColumn() > 0) {
        sendResponse(false, 'Email already exists');
    }

    // Generate password based on user_id + first + last name (no spaces)
    $rawPassword = $username . $firstName . $lastName; 
    $rawPassword = str_replace(' ', '', $rawPassword);
    $hashedPassword = password_hash($rawPassword, PASSWORD_DEFAULT);

    try {
        // Start transaction
        $pdo->beginTransaction();

        // Insert user
        $stmt = $pdo->prepare("
            INSERT INTO users (first_name, last_name, user_id, email, password, role_id, department_id, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
        ");

        $inserted = $stmt->execute([
            $firstName,
            $lastName,
            $username,
            $email,
            $hashedPassword,
            $roleId,
            $departmentId,
            $status
        ]);

        if (!$inserted) {
            throw new Exception('Failed to create user');
        }

        // Get the newly created user ID
        $newUserId = $pdo->lastInsertId();

        // Initialize user permissions based on role
        if (!initializeUserPermissions($pdo, $newUserId, $roleId)) {
            throw new Exception('Failed to initialize user permissions');
        }

        // Commit transaction
        $pdo->commit();

        sendResponse(true, "User created successfully with default permissions. Default password: $rawPassword");

    } catch (Exception $e) {
        // Rollback on error
        $pdo->rollBack();
        sendResponse(false, 'Failed to create user: ' . $e->getMessage());
    }
}

// Update user
function updateUser($pdo) {
    $id = $_POST['id'] ?? null;
    $firstName = trim($_POST['firstName'] ?? '');
    $lastName = trim($_POST['lastName'] ?? '');
    $username = trim($_POST['username'] ?? '');
    $email = trim($_POST['email'] ?? '');
    $roleId = $_POST['roleId'] ?? null;
    $departmentId = $_POST['departmentId'] ?? null;
    $status = $_POST['status'] ?? 'Active';

    // Validation
    if (!$id) sendResponse(false, 'User ID is required');

    $errors = [];
    if (!$firstName) $errors[] = 'First name is required';
    if (!$lastName) $errors[] = 'Last name is required';
    if (!$username) $errors[] = 'User ID is required';
    if (!$email) $errors[] = 'Email is required';
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) $errors[] = 'Invalid email format';
    if (!$roleId) $errors[] = 'Role is required';
    if (!$departmentId) $errors[] = 'Department is required';

    if (!empty($errors)) {
        sendResponse(false, implode(', ', $errors));
    }

    // Check for duplicate username (excluding current user)
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM users WHERE user_id = ? AND id != ?");
    $stmt->execute([$username, $id]);
    if ($stmt->fetchColumn() > 0) {
        sendResponse(false, 'User ID already exists');
    }

    // Check for duplicate email (excluding current user)
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM users WHERE email = ? AND id != ?");
    $stmt->execute([$email, $id]);
    if ($stmt->fetchColumn() > 0) {
        sendResponse(false, 'Email already exists');
    }

    try {
        // Get current role to check if it changed
        $stmt = $pdo->prepare("SELECT role_id FROM users WHERE id = ?");
        $stmt->execute([$id]);
        $currentUser = $stmt->fetch(PDO::FETCH_ASSOC);
        $roleChanged = ($currentUser['role_id'] != $roleId);

        // Start transaction
        $pdo->beginTransaction();

        // Update user
        $stmt = $pdo->prepare("
            UPDATE users 
            SET first_name = ?, 
                last_name = ?, 
                user_id = ?, 
                email = ?, 
                role_id = ?, 
                department_id = ?, 
                status = ?,
                updated_at = NOW()
            WHERE id = ?
        ");

        $updated = $stmt->execute([
            $firstName,
            $lastName,
            $username,
            $email,
            $roleId,
            $departmentId,
            $status,
            $id
        ]);

        if (!$updated) {
            throw new Exception('Failed to update user');
        }

        // If role changed, reset permissions to new role defaults
        if ($roleChanged) {
            if (!initializeUserPermissions($pdo, $id, $roleId)) {
                throw new Exception('Failed to update user permissions');
            }
        }

        // Commit transaction
        $pdo->commit();

        $message = $roleChanged 
            ? 'User updated successfully. Permissions have been reset to new role defaults.' 
            : 'User updated successfully';
        
        sendResponse(true, $message);

    } catch (Exception $e) {
        // Rollback on error
        $pdo->rollBack();
        sendResponse(false, 'Failed to update user: ' . $e->getMessage());
    }
}

// Toggle user status
function toggleStatus($pdo) {
    $id = $_POST['id'] ?? null;
    $newStatus = $_POST['status'] ?? null;

    if (!$id || !$newStatus) {
        sendResponse(false, 'User ID and status are required');
    }

    if (!in_array($newStatus, ['Active', 'Inactive'])) {
        sendResponse(false, 'Invalid status value');
    }

    $stmt = $pdo->prepare("UPDATE users SET status = ?, updated_at = NOW() WHERE id = ?");
    $updated = $stmt->execute([$newStatus, $id]);

    if ($updated) {
        sendResponse(true, "User status changed to $newStatus");
    } else {
        sendResponse(false, 'Failed to update status');
    }
}

// Delete user
function deleteUser($pdo) {
    $id = $_POST['id'] ?? null;

    if (!$id) {
        sendResponse(false, 'User ID is required');
    }

    try {
        // Start transaction
        $pdo->beginTransaction();

        // Delete user permissions first (foreign key constraint)
        $stmt = $pdo->prepare("DELETE FROM user_permissions WHERE user_id = ?");
        $stmt->execute([$id]);

        // Delete user
        $stmt = $pdo->prepare("DELETE FROM users WHERE id = ?");
        $deleted = $stmt->execute([$id]);

        if (!$deleted) {
            throw new Exception('Failed to delete user');
        }

        // Commit transaction
        $pdo->commit();

        sendResponse(true, 'User and associated permissions deleted successfully');

    } catch (Exception $e) {
        // Rollback on error
        $pdo->rollBack();
        sendResponse(false, 'Failed to delete user: ' . $e->getMessage());
    }
}

// Send JSON response
function sendResponse($success, $message, $users = []) {
    echo json_encode([
        'success' => $success,
        'message' => $message,
        'users' => $users
    ]);
    exit;
}
?>