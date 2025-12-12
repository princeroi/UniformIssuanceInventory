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

/**
 * Generate unique transaction number
 */
function generateTransactionNumber($pdo) {
    $prefix = 'DEL';
    $date = date('Ymd');
    
    // Get the last transaction number for today
    $stmt = $pdo->prepare("
        SELECT transaction_number 
        FROM deliveries 
        WHERE transaction_number LIKE ? 
        ORDER BY transaction_number DESC 
        LIMIT 1
    ");
    $stmt->execute([$prefix . $date . '%']);
    $lastTxn = $stmt->fetchColumn();
    
    if ($lastTxn) {
        // Extract the sequence number and increment
        $sequence = intval(substr($lastTxn, -4)) + 1;
    } else {
        $sequence = 1;
    }
    
    return $prefix . $date . str_pad($sequence, 4, '0', STR_PAD_LEFT);
}

try {
    $pdo = new PDO($dsn, $user, $pass, $options);
    
    $action = $_GET['action'] ?? $_POST['action'] ?? '';
    
    switch($action) {
        case 'createDelivery':
            createDelivery($pdo);
            break;
            
        case 'getDeliveries':
            getDeliveries($pdo);
            break;
            
        case 'getDeliveryById':
            getDeliveryById($pdo);
            break;
            
        case 'markAsDelivered':
            markAsDelivered($pdo);
            break;
            
        case 'deleteDelivery':
            deleteDelivery($pdo);
            break;
            
        case 'getItems':
            getItems($pdo);
            break;
            
        default:
            sendResponse(false, "Invalid action");
            break;
    }
} catch (PDOException $e) {
    sendResponse(false, "Database error: " . $e->getMessage());
}

/**
 * Create new delivery
 */
function createDelivery($pdo) {
    $item_code = $_POST['item_code'] ?? '';
    $quantity = intval($_POST['quantity'] ?? 0);
    $order_date = $_POST['order_date'] ?? date('Y-m-d');
    $supplier = $_POST['supplier'] ?? '';
    $received_by = $_POST['received_by'] ?? '';
    $expected_days = intval($_POST['expected_days'] ?? 7);
    $notes = $_POST['notes'] ?? '';
    
    $errors = [];
    if (!$item_code) $errors[] = 'Item is required';
    if ($quantity <= 0) $errors[] = 'Quantity must be greater than 0';
    if (!$order_date) $errors[] = 'Order date is required';
    if (!$supplier) $errors[] = 'Supplier is required';
    if (!$received_by) $errors[] = 'Received by is required';
    
    if (!empty($errors)) sendResponse(false, implode(", ", $errors));
    
    try {
        // Get item details
        $stmt = $pdo->prepare("SELECT item_name, category, size FROM items WHERE item_code = ?");
        $stmt->execute([$item_code]);
        $item = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$item) {
            sendResponse(false, 'Item not found');
        }
        
        // Generate transaction number
        $transaction_number = generateTransactionNumber($pdo);
        
        // Calculate expected date from order date
        $expected_date = date('Y-m-d', strtotime($order_date . " +{$expected_days} days"));
        
        // Insert delivery
        $stmt = $pdo->prepare("
            INSERT INTO deliveries 
            (transaction_number, item_code, item_name, category, size, quantity, supplier, 
             received_by, order_date, expected_date, notes, delivery_status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending')
        ");
        
        $inserted = $stmt->execute([
            $transaction_number,
            $item_code,
            $item['item_name'],
            $item['category'],
            $item['size'],
            $quantity,
            $supplier,
            $received_by,
            $order_date,
            $expected_date,
            $notes
        ]);
        
        if ($inserted) {
            sendResponse(true, 'Delivery created successfully', [
                'transaction_number' => $transaction_number
            ]);
        } else {
            sendResponse(false, 'Failed to create delivery');
        }
        
    } catch (Exception $e) {
        sendResponse(false, $e->getMessage());
    }
}

/**
 * Get all deliveries
 */
function getDeliveries($pdo) {
    try {
        $status = $_GET['status'] ?? 'all';
        
        if ($status === 'all') {
            $stmt = $pdo->query("
                SELECT * FROM deliveries 
                ORDER BY 
                    CASE WHEN delivery_status = 'Pending' THEN 0 ELSE 1 END,
                    order_date DESC
            ");
        } else {
            $stmt = $pdo->prepare("
                SELECT * FROM deliveries 
                WHERE delivery_status = ?
                ORDER BY order_date DESC
            ");
            $stmt->execute([$status]);
        }
        
        $deliveries = $stmt->fetchAll(PDO::FETCH_ASSOC);
        sendResponse(true, 'Deliveries retrieved successfully', $deliveries);
        
    } catch (PDOException $e) {
        sendResponse(false, 'Failed to retrieve deliveries: ' . $e->getMessage());
    }
}

/**
 * Get single delivery by ID
 */
function getDeliveryById($pdo) {
    $id = $_GET['id'] ?? '';
    
    if (!$id) {
        sendResponse(false, 'Delivery ID is required');
    }
    
    try {
        $stmt = $pdo->prepare("SELECT * FROM deliveries WHERE id = ?");
        $stmt->execute([$id]);
        $delivery = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($delivery) {
            sendResponse(true, 'Delivery retrieved successfully', $delivery);
        } else {
            sendResponse(false, 'Delivery not found');
        }
    } catch (PDOException $e) {
        sendResponse(false, 'Failed to retrieve delivery: ' . $e->getMessage());
    }
}

/**
 * Mark delivery as delivered and update inventory
 */
function markAsDelivered($pdo) {
    $id = $_POST['id'] ?? '';
    
    if (!$id) {
        sendResponse(false, 'Delivery ID is required');
    }
    
    try {
        $pdo->beginTransaction();
        
        // Get delivery details
        $stmt = $pdo->prepare("SELECT * FROM deliveries WHERE id = ? AND delivery_status = 'Pending'");
        $stmt->execute([$id]);
        $delivery = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$delivery) {
            $pdo->rollBack();
            sendResponse(false, 'Delivery not found or already delivered');
        }
        
        // Update delivery status
        $stmt = $pdo->prepare("
            UPDATE deliveries 
            SET delivery_status = 'Delivered', 
                delivered_date = NOW()
            WHERE id = ?
        ");
        $stmt->execute([$id]);
        
        // Update inventory quantity
        $stmt = $pdo->prepare("
            UPDATE items 
            SET quantity = quantity + ?
            WHERE item_code = ?
        ");
        $stmt->execute([$delivery['quantity'], $delivery['item_code']]);
        
        $pdo->commit();
        
        sendResponse(true, 'Delivery marked as delivered and inventory updated');
        
    } catch (PDOException $e) {
        $pdo->rollBack();
        sendResponse(false, 'Failed to mark as delivered: ' . $e->getMessage());
    }
}

/**
 * Delete delivery (only if pending)
 */
function deleteDelivery($pdo) {
    $id = $_POST['id'] ?? '';
    
    if (!$id) {
        sendResponse(false, 'Delivery ID is required');
    }
    
    try {
        // Check if delivery is pending
        $stmt = $pdo->prepare("SELECT delivery_status FROM deliveries WHERE id = ?");
        $stmt->execute([$id]);
        $delivery = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$delivery) {
            sendResponse(false, 'Delivery not found');
        }
        
        if ($delivery['delivery_status'] === 'Delivered') {
            sendResponse(false, 'Cannot delete a delivered order');
        }
        
        // Delete delivery
        $stmt = $pdo->prepare("DELETE FROM deliveries WHERE id = ?");
        $deleted = $stmt->execute([$id]);
        
        if ($deleted && $stmt->rowCount() > 0) {
            sendResponse(true, 'Delivery deleted successfully');
        } else {
            sendResponse(false, 'Failed to delete delivery');
        }
        
    } catch (PDOException $e) {
        sendResponse(false, 'Failed to delete delivery: ' . $e->getMessage());
    }
}

/**
 * Get items for dropdown
 */
function getItems($pdo) {
    try {
        $stmt = $pdo->query("SELECT item_code, item_name, category, size FROM items ORDER BY item_name");
        $items = $stmt->fetchAll(PDO::FETCH_ASSOC);
        sendResponse(true, 'Items retrieved successfully', $items);
    } catch (PDOException $e) {
        sendResponse(false, 'Failed to retrieve items: ' . $e->getMessage());
    }
}