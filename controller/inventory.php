<?php
require 'config.php';
header('Content-Type: application/json');

// Define upload directory
define('UPLOAD_DIR', '../uploads/items/');

function sendResponse($success, $message, $data = null) {
    echo json_encode([
        'success' => $success,
        'message' => $message,
        'data' => $data
    ]);
    exit;
}

/**
 * Handle file upload and return the file path
 */
function handleImageUpload($file, $oldPath = null) {
    if (!isset($file) || $file['error'] === UPLOAD_ERR_NO_FILE) {
        return $oldPath; // Keep existing image if no new file
    }
    
    if ($file['error'] !== UPLOAD_ERR_OK) {
        throw new Exception('File upload error: ' . $file['error']);
    }
    
    // Validate file type
    $allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mimeType = finfo_file($finfo, $file['tmp_name']);
    finfo_close($finfo);
    
    if (!in_array($mimeType, $allowedTypes)) {
        throw new Exception('Invalid file type. Only JPG, PNG, GIF, and WebP images are allowed.');
    }
    
    // Validate file size (max 5MB)
    if ($file['size'] > 5 * 1024 * 1024) {
        throw new Exception('File size too large. Maximum size is 5MB.');
    }
    
    // Delete old image if exists
    if ($oldPath && file_exists(UPLOAD_DIR . $oldPath)) {
        unlink(UPLOAD_DIR . $oldPath);
    }
    
    // Generate unique filename
    $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
    $filename = uniqid('item_', true) . '.' . $extension;
    $destination = UPLOAD_DIR . $filename;
    
    // Create directory if it doesn't exist
    if (!file_exists(UPLOAD_DIR)) {
        mkdir(UPLOAD_DIR, 0755, true);
    }
    
    // Move uploaded file
    if (!move_uploaded_file($file['tmp_name'], $destination)) {
        throw new Exception('Failed to save uploaded file.');
    }
    
    return $filename;
}

/**
 * Delete image file
 */
function deleteImageFile($imagePath) {
    if ($imagePath && file_exists(UPLOAD_DIR . $imagePath)) {
        unlink(UPLOAD_DIR . $imagePath);
    }
}

try {
    $pdo = new PDO($dsn, $user, $pass, $options);
    
    $action = $_GET['action'] ?? $_POST['action'] ?? '';
    
    switch($action) {
        case 'createItems':
            createItems($pdo);
            break;
            
        case 'getItems':
            getItems($pdo);
            break;
            
        case 'getItemByCode':
            getItemByCode($pdo);
            break;
            
        case 'updateItem':
            updateItem($pdo);
            break;
            
        case 'checkItemUsage':
            checkItemUsage($pdo);
            break;
            
        case 'deleteItem':
            deleteItem($pdo);
            break;
            
        case 'adjustStock':
            adjustStock($pdo);
            break;
            
        default:
            sendResponse(false, "Invalid action");
            break;
    }
} catch (PDOException $e) {
    sendResponse(false, "Database error: " . $e->getMessage());
}


/**
 * Create new inventory item
 */
function createItems($pdo) {
    // TRIM ALL INPUTS TO REMOVE WHITESPACE
    $item_code = trim($_POST['item_code'] ?? '');
    $item_name = trim($_POST['item_name'] ?? '');
    $category = trim($_POST['category'] ?? '');
    $size = trim($_POST['size'] ?? '');
    $description = trim($_POST['description'] ?? '');
    $quantity = intval($_POST['quantity'] ?? 0);

    // Validate required fields
    $errors = [];
    if (!$item_code) $errors[] = 'Item code is required';
    if (!$item_name) $errors[] = 'Item name is required';
    if (!$category) $errors[] = 'Category is required';
    if (!$size) $errors[] = 'Size is required';
    
    if (!empty($errors)) {
        sendResponse(false, implode(", ", $errors));
        return;
    }

    // Check if item code exists
    try {
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM items WHERE TRIM(LOWER(item_code)) = TRIM(LOWER(?))");
        $stmt->execute([$item_code]);
        
        if ($stmt->fetchColumn() > 0) {
            sendResponse(false, 'Item code already exists');
            return;
        }

        // Handle image upload
        $imagePath = null;
        if (isset($_FILES['image']) && $_FILES['image']['error'] !== UPLOAD_ERR_NO_FILE) {
            $imagePath = handleImageUpload($_FILES['image']);
        }

        // Insert new item
        $stmt = $pdo->prepare("
            INSERT INTO items (item_code, item_name, category, size, description, quantity, image_path)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ");

        $inserted = $stmt->execute([
            $item_code,
            $item_name,
            $category,
            $size,
            $description,
            $quantity,
            $imagePath
        ]);

        if ($inserted) {
            // Get the min_stock calculation for this item
            $usageStmt = $pdo->prepare("
                SELECT SUM(quantity) AS total_quantity_issued
                FROM issuance_items
                WHERE item_code = ?
            ");
            $usageStmt->execute([$item_code]);
            $usage = $usageStmt->fetch(PDO::FETCH_ASSOC);
            $yearly_usage = $usage['total_quantity_issued'] ?? 0;

            // Return data that JavaScript expects
            sendResponse(true, 'Item created successfully', [
                'item_code' => $item_code,
                'calculation' => [
                    'reorder_point' => $yearly_usage,
                    'yearly_usage' => $yearly_usage
                ]
            ]);
        } else {
            sendResponse(false, 'Failed to create item');
        }
        
    } catch (Exception $e) {
        sendResponse(false, 'Error: ' . $e->getMessage());
    }
}

/**
 * Get all inventory items
 */
function getItems($pdo) {
    try {

        // 1. GET TOTAL QUANTITY ISSUED FROM LAST 3 MONTHS
        $usageQuery = $pdo->prepare("
            SELECT 
                item_code,
                SUM(quantity) AS total_quantity_issued
            FROM issuance_items
            WHERE issued_date >= DATE_SUB(CURDATE(), INTERVAL 3 MONTH)
            GROUP BY item_code
        ");
        $usageQuery->execute();
        $usageData = $usageQuery->fetchAll(PDO::FETCH_KEY_PAIR);


        // 2. GET ALL ITEMS FROM INVENTORY TABLE
        $stmt = $pdo->query("SELECT * FROM items ORDER BY item_code");
        $items = $stmt->fetchAll(PDO::FETCH_ASSOC);


        // 3. PROCESS EACH ITEM WITH CLASSIC REORDER POINT FORMULA
        foreach ($items as &$item) {
            $code = $item['item_code'];
            $currentQty = intval($item['quantity']);

            // Get last 3 months usage
            $last3MonthsUsage = $usageData[$code] ?? 0;

            // ═══════════════════════════════════════════════════════════
            // CLASSIC REORDER POINT FORMULA
            // Reorder Point = (Daily Usage × Lead Time Days) + Safety Stock
            // ═══════════════════════════════════════════════════════════
            
            // Calculate daily usage from last 3 months
            $daysIn3Months = 90;
            $dailyUsage = $last3MonthsUsage > 0 ? $last3MonthsUsage / $daysIn3Months : 0;
            
            // Define your lead time and safety stock
            $leadTimeDays = 14;        // Days to receive new stock from supplier
            $safetyStockDays = 30;     // Extra buffer days for unexpected demand/delays
            
            // Calculate reorder point
            $reorderPoint = round($dailyUsage * ($leadTimeDays + $safetyStockDays));
            
            // Set minimum reorder point (never reorder less than 10 units)
            $reorderPoint = max($reorderPoint, 10);
            
            // Store values
            $item['min_stock'] = $reorderPoint;
            $item['last_3mo_usage'] = $last3MonthsUsage;
            $item['daily_usage'] = round($dailyUsage, 2);
            $item['lead_time_days'] = $leadTimeDays;
            $item['safety_stock_days'] = $safetyStockDays;

            // ═══════════════════════════════════════════════════════════
            // DETERMINE REORDER STATUS & URGENCY
            // ═══════════════════════════════════════════════════════════
            
            if ($currentQty == 0) {
                // No stock at all
                $item['needs_reorder'] = true;
                $item['stock_status'] = 'OUT_OF_STOCK';
                $item['urgency'] = 'CRITICAL';
                $item['urgency_color'] = 'danger';
            } elseif ($currentQty <= $reorderPoint * 0.5) {
                // Below 50% of reorder point
                $item['needs_reorder'] = true;
                $item['stock_status'] = 'CRITICALLY_LOW';
                $item['urgency'] = 'HIGH';
                $item['urgency_color'] = 'warning';
            } elseif ($currentQty <= $reorderPoint) {
                // At or below reorder point
                $item['needs_reorder'] = true;
                $item['stock_status'] = 'LOW_STOCK';
                $item['urgency'] = 'MEDIUM';
                $item['urgency_color'] = 'info';
            } else {
                // Above reorder point - sufficient stock
                $item['needs_reorder'] = false;
                $item['stock_status'] = 'IN_STOCK';
                $item['urgency'] = 'NONE';
                $item['urgency_color'] = 'success';
            }

            // ═══════════════════════════════════════════════════════════
            // CALCULATE SUGGESTED REORDER QUANTITY
            // ═══════════════════════════════════════════════════════════
            
            // Order enough to bring stock back to reorder point level
            $item['suggested_reorder_qty'] = max(0, $reorderPoint - $currentQty);
            
            // Calculate days of stock remaining at current usage rate
            if ($dailyUsage > 0) {
                $item['days_of_stock_remaining'] = round($currentQty / $dailyUsage);
            } else {
                $item['days_of_stock_remaining'] = 999; // No usage data
            }

            // Image URL
            if ($item['image_path']) {
                $item['image_url'] = 'uploads/items/' . $item['image_path'];
            } else {
                $item['image_url'] = null;
            }
        }


        // 4. SEND RESPONSE
        sendResponse(true, 'Items retrieved successfully', $items);

    } catch (PDOException $e) {
        sendResponse(false, 'Failed to retrieve items: ' . $e->getMessage());
    }
}


/**
 * Get single item by code
 */
function getItemByCode($pdo) {
    $item_code = $_GET['item_code'] ?? '';
    
    if (!$item_code) {
        sendResponse(false, 'Item code is required');
    }
    
    try {
        $stmt = $pdo->prepare("SELECT * FROM items WHERE item_code = ?");
        $stmt->execute([$item_code]);
        $item = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($item) {
            // Add full image URL
            if ($item['image_path']) {
                $item['image_url'] = 'uploads/items/' . $item['image_path'];
            } else {
                $item['image_url'] = null;
            }
            
            sendResponse(true, 'Item retrieved successfully', $item);
        } else {
            sendResponse(false, 'Item not found');
        }
    } catch (PDOException $e) {
        sendResponse(false, 'Failed to retrieve item: ' . $e->getMessage());
    }
}

/**
 * Update inventory item
 */
function updateItem($pdo) {
    $item_code = $_POST['item_code'] ?? '';
    $item_name = $_POST['item_name'] ?? '';
    $category = $_POST['category'] ?? '';
    $size = $_POST['size'] ?? '';
    $description = $_POST['description'] ?? '';
    $min_stock = $_POST['min_stock'] ?? 0;
    $quantity = $_POST['quantity'] ?? 0;

    $stmt = $pdo->prepare("SELECT * FROM items WHERE item_code = ?");
    $stmt->execute([$item_code]);
    $item = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$item) sendResponse(false, 'Item not found');

    // Check duplicate name
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM items WHERE item_name = ? AND item_code != ?");
    $stmt->execute([$item_name, $item_code]);
    if ($stmt->fetchColumn() > 0) sendResponse(false, 'Item name already exists for another item');

    try {
        // Handle image upload
        $imagePath = $item['image_path']; // keep existing
        if (isset($_FILES['image'])) {
            $imagePath = handleImageUpload($_FILES['image'], $item['image_path']);
        }

        $stmt = $pdo->prepare("
            UPDATE items 
            SET item_name = ?, category = ?, size = ?, description = ?, min_stock = ?, quantity = ?, image_path = ?
            WHERE item_code = ?
        ");

        $updated = $stmt->execute([
            $item_name,
            $category,
            $size,
            $description,
            $min_stock,
            $quantity,
            $imagePath,
            $item_code
        ]);

        if ($updated) sendResponse(true, 'Item updated successfully');
        else sendResponse(false, 'Failed to update item');
        
    } catch (Exception $e) {
        sendResponse(false, $e->getMessage());
    }
}

/**
 * Check if item has issuance history
 */
function checkItemUsage($pdo) {
    $itemCode = $_GET['item_code'] ?? '';
    
    if (!$itemCode) {
        sendResponse(false, 'Item code is required');
    }
    
    try {
        // Check if item exists in issuance_items
        $stmt = $pdo->prepare("
            SELECT 
                COUNT(DISTINCT transaction_id) as issuance_count,
                SUM(quantity) as total_items_issued
            FROM issuance_items 
            WHERE item_code = ?
        ");
        $stmt->execute([$itemCode]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        $hasIssuances = $result['issuance_count'] > 0;
        
        sendResponse(true, 'Usage check complete', [
            'has_issuances' => $hasIssuances,
            'issuance_count' => (int)$result['issuance_count'],
            'total_items_issued' => (int)$result['total_items_issued']
        ]);
        
    } catch (PDOException $e) {
        sendResponse(false, 'Failed to check item usage: ' . $e->getMessage());
    }
}

/**
 * Delete inventory item with cascade option
 * DELETES FROM: items → issuance_items → issuance_transactions
 */
/**
 * Delete inventory item with cascade option
 * DELETES FROM: items → issuance_items → issuance_transactions
 */
function deleteItem($pdo) {
    $itemCode = $_POST['item_code'] ?? '';
    $cascadeDelete = $_POST['cascade_delete'] ?? '0';
    
    if (!$itemCode) {
        sendResponse(false, 'Item code is required');
    }
    
    try {
        // Start transaction for atomic operation
        $pdo->beginTransaction();
        
        // ═══════════════════════════════════════════════════════════════
        // STEP 1: CHECK IF ITEM HAS ISSUANCE HISTORY
        // ═══════════════════════════════════════════════════════════════
        $checkStmt = $pdo->prepare("
            SELECT 
                COUNT(DISTINCT transaction_id) as issuance_count,
                SUM(quantity) as total_issued
            FROM issuance_items 
            WHERE item_code = ?
        ");
        $checkStmt->execute([$itemCode]);
        $usage = $checkStmt->fetch(PDO::FETCH_ASSOC);
        
        $hasIssuances = $usage['issuance_count'] > 0;
        
        // If item has issuances but cascade is not enabled, block deletion
        if ($hasIssuances && $cascadeDelete !== '1') {
            $pdo->rollBack();
            sendResponse(false, 'CANNOT_DELETE_HAS_ISSUANCES', [
                'has_issuances' => true,
                'issuance_count' => (int)$usage['issuance_count'],
                'total_issued' => (int)$usage['total_issued']
            ]);
            return;
        }
        
        // Get item details for image deletion
        $stmt = $pdo->prepare("SELECT image_path, item_name FROM items WHERE item_code = ?");
        $stmt->execute([$itemCode]);
        $item = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$item) {
            $pdo->rollBack();
            sendResponse(false, 'Item not found');
            return;
        }
        
        $deletedIssuanceItems = 0;
        $deletedTransactions = 0;
        
        // ═══════════════════════════════════════════════════════════════
        // STEP 2: CASCADE DELETE FROM ISSUANCE TABLES (if enabled)
        // ═══════════════════════════════════════════════════════════════
        if ($cascadeDelete === '1' && $hasIssuances) {
            
            // A. Get all transaction_ids that contain this item
            $stmt = $pdo->prepare("
                SELECT DISTINCT transaction_id 
                FROM issuance_items 
                WHERE item_code = ?
            ");
            $stmt->execute([$itemCode]);
            $affectedTransactionIds = $stmt->fetchAll(PDO::FETCH_COLUMN);
            
            // B. DELETE FROM issuance_items table
            $stmt = $pdo->prepare("DELETE FROM issuance_items WHERE item_code = ?");
            $stmt->execute([$itemCode]);
            $deletedIssuanceItems = $stmt->rowCount();
            
            // C. DELETE FROM issuance_transactions table (remove empty transactions)
            foreach ($affectedTransactionIds as $transactionId) {
                // Check if this transaction still has ANY items left
                $stmt = $pdo->prepare("
                    SELECT COUNT(*) as remaining_items 
                    FROM issuance_items 
                    WHERE transaction_id = ?
                ");
                $stmt->execute([$transactionId]);
                $remainingItems = $stmt->fetch(PDO::FETCH_ASSOC)['remaining_items'];
                
                // If NO items remain, DELETE the transaction
                if ($remainingItems == 0) {
                    $stmt = $pdo->prepare("
                        DELETE FROM issuance_transactions 
                        WHERE transaction_id = ?
                    ");
                    $stmt->execute([$transactionId]);
                    
                    if ($stmt->rowCount() > 0) {
                        $deletedTransactions++;
                    }
                }
            }
        }
        
        // ═══════════════════════════════════════════════════════════════
        // STEP 3: DELETE FROM INVENTORY (items table)
        // ═══════════════════════════════════════════════════════════════
        $stmt = $pdo->prepare("DELETE FROM items WHERE item_code = ?");
        $stmt->execute([$itemCode]);
        $deletedFromInventory = $stmt->rowCount();
        
        // ═══════════════════════════════════════════════════════════════
        // STEP 4: DELETE IMAGE FILE FROM SERVER
        // ═══════════════════════════════════════════════════════════════
        if ($item['image_path']) {
            deleteImageFile($item['image_path']);
        }
        
        // ═══════════════════════════════════════════════════════════════
        // COMMIT ALL CHANGES
        // ═══════════════════════════════════════════════════════════════
        $pdo->commit();
        
        // Build success message
        $message = "✅ Item '{$item['item_name']}' deleted successfully";
        
        if ($cascadeDelete === '1' && $hasIssuances) {
            $details = [];
            if ($deletedIssuanceItems > 0) {
                $details[] = "{$deletedIssuanceItems} issuance record(s)";
            }
            if ($deletedTransactions > 0) {
                $details[] = "{$deletedTransactions} transaction(s)";
            }
            if (!empty($details)) {
                $message .= ". Also removed: " . implode(", ", $details);
            }
        }
        
        sendResponse(true, $message, [
            'deleted_from_inventory' => $deletedFromInventory,
            'deleted_issuance_items' => $deletedIssuanceItems,
            'deleted_transactions' => $deletedTransactions,
            'cascade_enabled' => $cascadeDelete === '1'
        ]);
        
    } catch (PDOException $e) {
        // ═══════════════════════════════════════════════════════════════
        // ROLLBACK ON ERROR
        // ═══════════════════════════════════════════════════════════════
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        
        // Check for foreign key constraint error
        if (strpos($e->getMessage(), '1451') !== false) {
            sendResponse(false, 'Cannot delete: Item has issuance history. Enable cascade delete to proceed.', [
                'error_code' => 'FOREIGN_KEY_CONSTRAINT'
            ]);
        } else {
            sendResponse(false, 'Database error: ' . $e->getMessage());
        }
    }
}

/**
 * Adjust stock (add or remove)
 */
function adjustStock($pdo) {
    $item_code = $_POST['item_code'] ?? '';
    $adjustment_type = $_POST['adjustment_type'] ?? '';
    $quantity = intval($_POST['quantity'] ?? 0);
    $reason = $_POST['reason'] ?? '';
    
    if (!$item_code) {
        sendResponse(false, 'Item code is required');
    }
    
    if (!in_array($adjustment_type, ['add', 'remove'])) {
        sendResponse(false, 'Invalid adjustment type');
    }
    
    if ($quantity <= 0) {
        sendResponse(false, 'Quantity must be greater than 0');
    }
    
    try {
        $stmt = $pdo->prepare("SELECT quantity FROM items WHERE item_code = ?");
        $stmt->execute([$item_code]);
        $current = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$current) {
            sendResponse(false, 'Item not found');
        }
        
        $current_quantity = intval($current['quantity']);
        
        if ($adjustment_type === 'add') {
            $new_quantity = $current_quantity + $quantity;
        } else {
            $new_quantity = $current_quantity - $quantity;
            if ($new_quantity < 0) {
                sendResponse(false, 'Cannot remove more items than available in stock');
            }
        }
        
        $stmt = $pdo->prepare("UPDATE items SET quantity = ? WHERE item_code = ?");
        $updated = $stmt->execute([$new_quantity, $item_code]);
        
        if ($updated) {
            $action_text = $adjustment_type === 'add' ? 'Added' : 'Removed';
            sendResponse(true, "{$action_text} {$quantity} units. New quantity: {$new_quantity}");
        } else {
            sendResponse(false, 'Failed to adjust stock');
        }
    } catch (PDOException $e) {
        sendResponse(false, 'Failed to adjust stock: ' . $e->getMessage());
    }
}
?>