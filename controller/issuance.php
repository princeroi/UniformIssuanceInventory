<?php
require 'config.php';
header('Content-Type: application/json');

function sendResponse($success, $message, $data = null) {
    echo json_encode([
        'success' => $success,
        'message' => $message,
        'data' => $data
    ]);
    exit;
}

try {
    $pdo = new PDO($dsn, $user, $pass, $options);
    
    $action = $_GET['action'] ?? $_POST['action'] ?? '';
    
    switch($action) {
        case 'getIssuances':
            getIssuances($pdo);
            break;
            
        case 'getIssuanceById':
            getIssuanceById($pdo);
            break;
            
        case 'getIssuanceStats':
            getIssuanceStats($pdo);
            break;
            
        default:
            sendResponse(false, "Invalid action");
            break;
    }
} catch (PDOException $e) {
    sendResponse(false, "Database error: " . $e->getMessage());
}

function getIssuances($pdo) {
    try {
        $search = $_GET['search'] ?? '';
        $issuanceType = $_GET['issuance_type'] ?? 'all';
        $dateFrom = $_GET['date_from'] ?? '';
        $dateTo = $_GET['date_to'] ?? '';
        
        $query = "SELECT * FROM issuance_transactions WHERE 1=1";
        $params = [];
        
        if (!empty($search)) {
            $query .= " AND (employee_name LIKE ? OR transaction_id LIKE ? OR issued_by LIKE ?)";
            $searchParam = "%{$search}%";
            $params[] = $searchParam;
            $params[] = $searchParam;
            $params[] = $searchParam;
        }
        
        if ($issuanceType !== 'all') {
            $query .= " AND issuance_type = ?";
            $params[] = $issuanceType;
        }
        
        if (!empty($dateFrom)) {
            $query .= " AND DATE(issuance_date) >= ?";
            $params[] = $dateFrom;
        }
        
        if (!empty($dateTo)) {
            $query .= " AND DATE(issuance_date) <= ?";
            $params[] = $dateTo;
        }
        
        $query .= " ORDER BY issuance_date DESC, transaction_date DESC";
        
        $stmt = $pdo->prepare($query);
        $stmt->execute($params);
        $issuances = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        sendResponse(true, 'Issuances retrieved successfully', $issuances);
        
    } catch (PDOException $e) {
        sendResponse(false, 'Failed to retrieve issuances: ' . $e->getMessage());
    }
}

function getIssuanceById($pdo) {
    $id = $_GET['id'] ?? '';
    
    if (!$id) {
        sendResponse(false, 'Issuance ID is required');
    }
    
    try {
        // Get issuance transaction details
        $stmt = $pdo->prepare("SELECT * FROM issuance_transactions WHERE id = ?");
        $stmt->execute([$id]);
        $issuance = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$issuance) {
            sendResponse(false, 'Issuance not found');
        }
        
        // Get all items for this transaction
        $stmt = $pdo->prepare("
            SELECT * FROM issuance_items 
            WHERE transaction_id = ? 
            ORDER BY issued_date DESC
        ");
        $stmt->execute([$issuance['transaction_id']]);
        $items = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Add items to issuance data
        $issuance['items'] = $items;
        
        sendResponse(true, 'Issuance retrieved successfully', $issuance);
        
    } catch (PDOException $e) {
        sendResponse(false, 'Failed to retrieve issuance: ' . $e->getMessage());
    }
}

function getIssuanceStats($pdo) {
    try {
        // Total issuances
        $stmt = $pdo->query("SELECT COUNT(*) as total FROM issuance_transactions");
        $total = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
        
        // This month's issuances
        $stmt = $pdo->query("
            SELECT COUNT(*) as total 
            FROM issuance_transactions 
            WHERE MONTH(issuance_date) = MONTH(CURRENT_DATE()) 
            AND YEAR(issuance_date) = YEAR(CURRENT_DATE())
        ");
        $thisMonth = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
        
        // Total items issued
        $stmt = $pdo->query("SELECT SUM(total_items) as total FROM issuance_transactions");
        $totalItems = $stmt->fetch(PDO::FETCH_ASSOC)['total'] ?? 0;
        
        // By issuance type
        $stmt = $pdo->query("
            SELECT issuance_type, COUNT(*) as count 
            FROM issuance_transactions 
            GROUP BY issuance_type
        ");
        $byType = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        sendResponse(true, 'Statistics retrieved successfully', [
            'total' => $total,
            'this_month' => $thisMonth,
            'total_items' => $totalItems,
            'by_type' => $byType
        ]);
        
    } catch (PDOException $e) {
        sendResponse(false, 'Failed to retrieve statistics: ' . $e->getMessage());
    }
}
?>