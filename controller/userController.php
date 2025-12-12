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

        default:
            sendResponse(false, 'Invalid action');
            break;
    }

} catch (PDOException $e) {
    sendResponse(false, 'Database error: ' . $e->getMessage());
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
    $rawPassword = str_replace(' ', '', $rawPassword); // remove any spaces
    $hashedPassword = password_hash($rawPassword, PASSWORD_DEFAULT);

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

    if ($inserted) {
        sendResponse(true, "User created successfully. Default password: $rawPassword");
    } else {
        sendResponse(false, 'Failed to create user');
    }
}





// Update user
function updateUser($pdo) {
    $id = $_POST['id'] ?? null;
    $firstName = trim($_POST['firstName'] ?? '');
    $lastName = trim($_POST['lastName'] ?? '');
    $username = trim($_POST['username'] ?? '');
    $email = trim($_POST['email'] ?? '');
    $password = trim($_POST['password'] ?? ''); // if empty, generate based on ID + name
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

    // Generate password if empty
    if (empty($password)) {
        $password = str_replace(' ', '', $username . $firstName . $lastName);
    }
    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);

    // Update user
    $stmt = $pdo->prepare("
        UPDATE users 
        SET first_name = ?, 
            last_name = ?, 
            user_id = ?, 
            email = ?, 
            password = ?,
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
        $hashedPassword,
        $roleId,
        $departmentId,
        $status,
        $id
    ]);

    if ($updated) {
        sendResponse(true, 'User updated successfully. Password: ' . $password);
    } else {
        sendResponse(false, 'Failed to update user');
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

    // Optional: Check if user has related records before deleting
    // You might want to implement soft delete instead of hard delete
    
    $stmt = $pdo->prepare("DELETE FROM users WHERE id = ?");
    $deleted = $stmt->execute([$id]);

    if ($deleted) {
        sendResponse(true, 'User deleted successfully');
    } else {
        sendResponse(false, 'Failed to delete user');
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