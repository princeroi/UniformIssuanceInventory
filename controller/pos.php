<?php
// pos.php - Updated with Dynamic Sites and Issuance Types from Database
require_once 'config.php';
session_start();

header('Content-Type: application/json');

try {
    $pdo = new PDO($dsn, $user, $pass, $options);
    
    $action = $_GET['action'] ?? $_POST['action'] ?? '';
    
    if ($action === 'getIssuanceTypes') {
        // Get all active issuance types
        $stmt = $pdo->query("
            SELECT 
                id,
                type_name,
                description
            FROM issuance_types 
            WHERE is_active = 1
            ORDER BY type_name ASC
        ");
        
        $types = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'message' => 'Issuance types retrieved successfully',
            'data' => $types
        ]);
        
    } elseif ($action === 'getSites') {
        // NEW: Get all sites
        $stmt = $pdo->query("
            SELECT 
                id,
                site_name,
                location
            FROM sites 
            WHERE is_active = 1
            ORDER BY site_name ASC
        ");
        
        $sites = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'message' => 'Sites retrieved successfully',
            'data' => $sites
        ]);
        
    } elseif ($action === 'getItems') {
        $checkStmt = $pdo->query("SELECT COUNT(*) as total FROM items");
        $totalCount = $checkStmt->fetch(PDO::FETCH_ASSOC);
        
        $stmt = $pdo->query("
            SELECT 
                item_code,
                item_name,
                category,
                size,
                quantity,
                min_stock,
                image_path
            FROM items 
            ORDER BY category, item_name
        ");
        
        $items = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($items as &$item) {
            if ($item['image_path']) {
                $item['image_url'] = 'uploads/items/' . $item['image_path'];
            } else {
                $item['image_url'] = 'assets/no-image.png';
            }
        }
        
        echo json_encode([
            'success' => true,
            'message' => 'Items retrieved successfully',
            'data' => $items,
            'debug' => [
                'total_items_in_db' => $totalCount['total'],
                'items_returned' => count($items)
            ]
        ]);
        
    } elseif ($action === 'searchItems') {
        $search = $_GET['search'] ?? '';
        
        if (empty($search)) {
            $stmt = $pdo->query("
                SELECT 
                    item_code,
                    item_name,
                    category,
                    size,
                    quantity,
                    min_stock,
                    image_path
                FROM items 
                ORDER BY item_name
            ");
        } else {
            $stmt = $pdo->prepare("
                SELECT 
                    item_code,
                    item_name,
                    category,
                    size,
                    quantity,
                    min_stock,
                    image_path
                FROM items 
                WHERE (item_name LIKE ? OR item_code LIKE ?)
                ORDER BY item_name
            ");
            $searchPattern = "%{$search}%";
            $stmt->execute([$searchPattern, $searchPattern]);
        }
        
        $items = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($items as &$item) {
            if ($item['image_path']) {
                $item['image_url'] = 'uploads/items/' . $item['image_path'];
            } else {
                $item['image_url'] = 'assets/no-image.png';
            }
        }
        
        echo json_encode([
            'success' => true,
            'message' => 'Search completed',
            'data' => $items
        ]);
        
    } elseif ($action === 'getItemsByCategory') {
        $category = $_GET['category'] ?? '';
        
        if (empty($category) || $category === 'All Categories') {
            $stmt = $pdo->query("
                SELECT 
                    item_code,
                    item_name,
                    category,
                    size,
                    quantity,
                    min_stock,
                    image_path
                FROM items 
                ORDER BY item_name
            ");
        } else {
            $stmt = $pdo->prepare("
                SELECT 
                    item_code,
                    item_name,
                    category,
                    size,
                    quantity,
                    min_stock,
                    image_path
                FROM items 
                WHERE category = ?
                ORDER BY item_name
            ");
            $stmt->execute([$category]);
        }
        
        $items = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($items as &$item) {
            if ($item['image_path']) {
                $item['image_url'] = 'uploads/items/' . $item['image_path'];
            } else {
                $item['image_url'] = 'assets/no-image.png';
            }
        }
        
        echo json_encode([
            'success' => true,
            'message' => 'Items retrieved',
            'data' => $items,
            'category' => $category,
            'count' => count($items)
        ]);
        
    } elseif ($action === 'completeTransaction') {
        $employeeName = $_POST['employee_name'] ?? '';
        $siteAssigned = $_POST['site_assigned'] ?? '';
        $issuanceType = $_POST['issuance_type'] ?? '';
        $itemsJson = $_POST['items'] ?? '';
        
        $issuedByUserId = $_SESSION['user_id'] ?? null;
        $issuedByName = $_SESSION['name'] ?? 'Unknown User';
        
        if (empty($employeeName)) {
            echo json_encode([
                'success' => false,
                'message' => 'Employee name is required'
            ]);
            exit;
        }
        
        if (empty($siteAssigned)) {
            echo json_encode([
                'success' => false,
                'message' => 'Site assigned is required'
            ]);
            exit;
        }
        
        if (empty($issuanceType)) {
            echo json_encode([
                'success' => false,
                'message' => 'Issuance type is required'
            ]);
            exit;
        }
        
        if (empty($itemsJson)) {
            echo json_encode([
                'success' => false,
                'message' => 'No items in cart'
            ]);
            exit;
        }
        
        if (!$issuedByUserId) {
            echo json_encode([
                'success' => false,
                'message' => 'Session expired. Please login again.'
            ]);
            exit;
        }
        
        $cartItems = json_decode($itemsJson, true);
        
        if (!is_array($cartItems) || count($cartItems) === 0) {
            echo json_encode([
                'success' => false,
                'message' => 'Invalid cart data'
            ]);
            exit;
        }
        
        $pdo->beginTransaction();
        
        try {
            $totalItems = 0;
            foreach ($cartItems as $item) {
                $totalItems += $item['quantity'];
            }
            
            $transactionId = 'TXN-' . date('Ymd') . '-' . str_pad(rand(1, 999999), 6, '0', STR_PAD_LEFT);
            
            $checkStmt = $pdo->prepare("SELECT COUNT(*) FROM issuance_transactions WHERE transaction_id = ?");
            $checkStmt->execute([$transactionId]);
            
            while ($checkStmt->fetchColumn() > 0) {
                $transactionId = 'TXN-' . date('Ymd') . '-' . str_pad(rand(1, 999999), 6, '0', STR_PAD_LEFT);
                $checkStmt->execute([$transactionId]);
            }
            
            $stmt = $pdo->prepare("
                INSERT INTO issuance_transactions 
                (transaction_id, employee_name, issuance_type, site_assigned, total_items, issued_by, issued_by_id, issuance_date) 
                VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
            ");
            
            $stmt->execute([
                $transactionId,
                $employeeName,
                $issuanceType,
                $siteAssigned,
                $totalItems,
                $issuedByName,
                $issuedByUserId
            ]);
            
            $stmtDetail = $pdo->prepare("
                INSERT INTO issuance_items 
                (transaction_id, item_code, item_name, category, size, site_assigned, quantity) 
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ");
            
            $stmtUpdate = $pdo->prepare("
                UPDATE items 
                SET quantity = quantity - ? 
                WHERE item_code = ?
            ");
            
            $stmtCheck = $pdo->prepare("
                SELECT quantity, category, size FROM items WHERE item_code = ?
            ");
            
            foreach ($cartItems as $item) {
                $itemCode = $item['item_code'];
                $itemName = $item['item_name'];
                $quantity = $item['quantity'];
                
                $stmtCheck->execute([$itemCode]);
                $currentItem = $stmtCheck->fetch(PDO::FETCH_ASSOC);
                
                if (!$currentItem) {
                    throw new Exception("Item not found: {$itemCode}");
                }
                
                if ($currentItem['quantity'] < $quantity) {
                    throw new Exception("Insufficient stock for {$itemName}. Available: {$currentItem['quantity']}, Requested: {$quantity}");
                }
                
                $stmtDetail->execute([
                    $transactionId,
                    $itemCode,
                    $itemName,
                    $currentItem['category'],
                    $currentItem['size'],
                    $siteAssigned,
                    $quantity
                ]);
                
                $stmtUpdate->execute([
                    $quantity,
                    $itemCode
                ]);
            }
            
            $pdo->commit();
            
            echo json_encode([
                'success' => true,
                'message' => 'Transaction completed successfully',
                'transaction_id' => $transactionId,
                'data' => [
                    'employee_name' => $employeeName,
                    'site_assigned' => $siteAssigned,
                    'issuance_type' => $issuanceType,
                    'total_items' => $totalItems,
                    'issued_by' => $issuedByName,
                    'issued_by_id' => $issuedByUserId,
                    'items_count' => count($cartItems)
                ]
            ]);
            
        } catch (Exception $e) {
            $pdo->rollBack();
            
            echo json_encode([
                'success' => false,
                'message' => 'Transaction failed: ' . $e->getMessage()
            ]);
        }
        
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Invalid action'
        ]);
    }
    
} catch (PDOException $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}
?>