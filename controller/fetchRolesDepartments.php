<?php

require 'config.php';
header('Content-Type: application/json');

try{
    $pdo = new PDO($dsn, $user, $pass, $options);

    // Fetch Roles
    $stmtRoles = $pdo->query("SELECT id, role_name From roles");
    $roles = $stmtRoles->fetchAll();

    // Fetch Departments
    $stmtDepartments = $pdo->query("SELECT id, department_name From departments");
    $departments = $stmtDepartments->fetchAll();

    echo json_encode([
        'success' => true,
        'roles' => $roles,
        'departments' => $departments
    ]);
}catch (PDOException $e){
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}