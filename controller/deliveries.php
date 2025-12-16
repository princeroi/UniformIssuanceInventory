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

function generateTransactionNumber($pdo) {
    $prefix = 'DEL';
    $date = date('Ymd');
    
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
            
        case 'getDeliveryHistory':
            getDeliveryHistory($pdo);
            break;
            
        default:
            sendResponse(false, "Invalid action");
            break;
    }
} catch (PDOException $e) {
    sendResponse(false, "Database error: " . $e->getMessage());
}

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
        $stmt = $pdo->prepare("SELECT item_name, category, size FROM items WHERE item_code = ?");
        $stmt->execute([$item_code]);
        $item = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$item) {
            sendResponse(false, 'Item not found');
        }
        
        $transaction_number = generateTransactionNumber($pdo);
        $expected_date = date('Y-m-d', strtotime($order_date . " +{$expected_days} days"));
        
        $stmt = $pdo->prepare("
            INSERT INTO deliveries 
            (transaction_number, item_code, item_name, category, size, quantity, 
             quantity_ordered, quantity_delivered, quantity_pending,
             supplier, received_by, order_date, expected_date, notes, delivery_status)
            VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, 'Pending')
        ");
        
        $inserted = $stmt->execute([
            $transaction_number,
            $item_code,
            $item['item_name'],
            $item['category'],
            $item['size'],
            $quantity,
            $quantity,
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

function markAsDelivered($pdo) {
    $id = $_POST['id'] ?? '';
    $quantity_to_deliver = intval($_POST['quantity_to_deliver'] ?? 0);
    $delivery_notes = $_POST['delivery_notes'] ?? '';
    
    if (!$id) {
        sendResponse(false, 'Delivery ID is required');
    }
    
    if ($quantity_to_deliver <= 0) {
        sendResponse(false, 'Quantity to deliver must be greater than 0');
    }
    
    try {
        $pdo->beginTransaction();
        
        $stmt = $pdo->prepare("SELECT * FROM deliveries WHERE id = ?");
        $stmt->execute([$id]);
        $delivery = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$delivery) {
            $pdo->rollBack();
            sendResponse(false, 'Delivery not found');
        }
        
        if ($delivery['quantity_pending'] <= 0) {
            $pdo->rollBack();
            sendResponse(false, 'No pending quantity to deliver');
        }
        
        if ($quantity_to_deliver > $delivery['quantity_pending']) {
            $pdo->rollBack();
            sendResponse(false, 'Quantity to deliver exceeds pending quantity');
        }
        
        $new_delivered = $delivery['quantity_delivered'] + $quantity_to_deliver;
        $new_pending = $delivery['quantity_pending'] - $quantity_to_deliver;
        
        $new_status = $new_pending > 0 ? 'Partial' : 'Delivered';
        
        $stmt = $pdo->prepare("
            UPDATE deliveries 
            SET quantity_delivered = ?,
                quantity_pending = ?,
                delivery_status = ?,
                delivered_date = CASE WHEN ? = 'Delivered' THEN NOW() ELSE delivered_date END
            WHERE id = ?
        ");
        $stmt->execute([$new_delivered, $new_pending, $new_status, $new_status, $id]);
        
        $stmt = $pdo->prepare("
            INSERT INTO delivery_history 
            (delivery_id, transaction_number, quantity_delivered, notes)
            VALUES (?, ?, ?, ?)
        ");
        $stmt->execute([
            $id,
            $delivery['transaction_number'],
            $quantity_to_deliver,
            $delivery_notes
        ]);
        
        $stmt = $pdo->prepare("
            UPDATE items 
            SET quantity = quantity + ?
            WHERE item_code = ?
        ");
        $stmt->execute([$quantity_to_deliver, $delivery['item_code']]);
        
        $pdo->commit();
        
        sendResponse(true, 'Delivery processed successfully', [
            'status' => $new_status,
            'delivered' => $new_delivered,
            'pending' => $new_pending
        ]);
        
    } catch (PDOException $e) {
        $pdo->rollBack();
        sendResponse(false, 'Failed to process delivery: ' . $e->getMessage());
    }
}

function deleteDelivery($pdo) {
    $id = $_POST['id'] ?? '';
    
    if (!$id) {
        sendResponse(false, 'Delivery ID is required');
    }
    
    try {
        $stmt = $pdo->prepare("SELECT delivery_status, quantity_delivered FROM deliveries WHERE id = ?");
        $stmt->execute([$id]);
        $delivery = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$delivery) {
            sendResponse(false, 'Delivery not found');
        }
        
        if ($delivery['quantity_delivered'] > 0) {
            sendResponse(false, 'Cannot delete a delivery with delivered items. Please contact administrator.');
        }
        
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

function getItems($pdo) {
    try {
        $stmt = $pdo->query("SELECT item_code, item_name, category, size FROM items ORDER BY item_name");
        $items = $stmt->fetchAll(PDO::FETCH_ASSOC);
        sendResponse(true, 'Items retrieved successfully', $items);
    } catch (PDOException $e) {
        sendResponse(false, 'Failed to retrieve items: ' . $e->getMessage());
    }
}

function getDeliveryHistory($pdo) {
    $delivery_id = $_GET['delivery_id'] ?? '';
    
    if (!$delivery_id) {
        sendResponse(false, 'Delivery ID is required');
    }
    
    try {
        $stmt = $pdo->prepare("
            SELECT * FROM delivery_history 
            WHERE delivery_id = ? 
            ORDER BY delivered_date DESC
        ");
        $stmt->execute([$delivery_id]);
        $history = $stmt->fetchAll(PDO::FETCH_ASSOC);
        sendResponse(true, 'Delivery history retrieved successfully', $history);
    } catch (PDOException $e) {
        sendResponse(false, 'Failed to retrieve delivery history: ' . $e->getMessage());
    }
}