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
        case 'getStats':
            getStats($pdo);
            break;
            
        case 'getRecentIssuances':
            getRecentIssuances($pdo);
            break;
            
        case 'getLowStockAlerts':
            getLowStockAlerts($pdo);
            break;
            
        default:
            sendResponse(false, "Invalid action");
            break;
    }
} catch (PDOException $e) {
    sendResponse(false, "Database error: " . $e->getMessage());
}

/**
 * Get dashboard statistics
 */
function getStats($pdo) {
    try {
        // Total items in inventory
        $totalItemsStmt = $pdo->query("SELECT COUNT(*) FROM items");
        $totalItems = $totalItemsStmt->fetchColumn();
        
        // Total issuances per year - count all rows for current year
        $currentYear = date('Y');
        
        // Try multiple approaches to ensure we get the count
        $totalIssuancesStmt = $pdo->prepare("
            SELECT COUNT(*) 
            FROM issuance_items 
            WHERE YEAR(issued_date) = ?
        ");
        $totalIssuancesStmt->execute([$currentYear]);
        $totalIssuances = $totalIssuancesStmt->fetchColumn();
        
        // If still 0, try getting all issuances to see if date format is the issue
        if ($totalIssuances == 0) {
            $allIssuancesStmt = $pdo->query("SELECT COUNT(*) FROM issuance_items");
            $totalIssuances = $allIssuancesStmt->fetchColumn();
        }
        
        // Total deliveries count
        $totalDeliveriesStmt = $pdo->query("SELECT COUNT(*) FROM deliveries");
        $totalDeliveries = $totalDeliveriesStmt->fetchColumn();
        
        // === LOW STOCK CALCULATION (SAME AS INVENTORY.PHP) ===
        
        // 1. GET USAGE DATA FROM LAST 3 MONTHS
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

        // 2. GET ALL ITEMS
        $itemsStmt = $pdo->query("SELECT item_code, quantity FROM items");
        $items = $itemsStmt->fetchAll(PDO::FETCH_ASSOC);

        // 3. COUNT LOW STOCK ITEMS USING REORDER POINT FORMULA
        $lowStockCount = 0;
        
        foreach ($items as $item) {
            $code = $item['item_code'];
            $currentQty = intval($item['quantity']);
            
            // Get last 3 months usage
            $last3MonthsUsage = $usageData[$code] ?? 0;
            
            // Calculate daily usage
            $daysIn3Months = 90;
            $dailyUsage = $last3MonthsUsage > 0 ? $last3MonthsUsage / $daysIn3Months : 0;
            
            // Calculate reorder point
            $leadTimeDays = 7;
            $safetyStockDays = 30;
            $reorderPoint = round($dailyUsage * ($leadTimeDays + $safetyStockDays));
            $reorderPoint = max($reorderPoint, 10);
            
            // Check if item is low stock (quantity <= reorder point)
            if ($currentQty <= $reorderPoint) {
                $lowStockCount++;
            }
        }
        
        $stats = [
            'total_items' => (int)$totalItems,
            'total_issuances' => (int)$totalIssuances,
            'total_deliveries' => (int)$totalDeliveries,
            'low_stock_items' => (int)$lowStockCount
        ];
        
        sendResponse(true, 'Statistics retrieved successfully', $stats);
        
    } catch (PDOException $e) {
        sendResponse(false, 'Failed to retrieve statistics: ' . $e->getMessage());
    }
}

/**
 * Get recent issuances (last 5)
 */
function getRecentIssuances($pdo) {
    try {
        $stmt = $pdo->query("
            SELECT 
                ii.id,
                ii.transaction_id,
                ii.item_name,
                ii.category,
                ii.size,
                ii.quantity,
                ii.issued_date,
                'Completed' as status
            FROM issuance_items ii
            ORDER BY ii.issued_date DESC, ii.id DESC
            LIMIT 5
        ");
        
        $issuances = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        sendResponse(true, 'Recent issuances retrieved successfully', $issuances);
        
    } catch (PDOException $e) {
        sendResponse(false, 'Failed to retrieve recent issuances: ' . $e->getMessage());
    }
}

/**
 * Get low stock alerts (items with quantity <= min_stock)
 * Uses the same reorder point calculation as inventory.php
 */
function getLowStockAlerts($pdo) {
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
        $stmt = $pdo->query("SELECT item_code, item_name, category, size, quantity, image_path FROM items ORDER BY item_code");
        $items = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // 3. CALCULATE MIN_STOCK AND FILTER LOW STOCK ITEMS
        $lowStockItems = [];
        
        foreach ($items as $item) {
            $code = $item['item_code'];
            $currentQty = intval($item['quantity']);

            // Get last 3 months usage
            $last3MonthsUsage = $usageData[$code] ?? 0;

            // Calculate daily usage from last 3 months
            $daysIn3Months = 90;
            $dailyUsage = $last3MonthsUsage > 0 ? $last3MonthsUsage / $daysIn3Months : 0;
            
            // Define lead time and safety stock
            $leadTimeDays = 7;
            $safetyStockDays = 30;
            
            // Calculate reorder point
            $reorderPoint = round($dailyUsage * ($leadTimeDays + $safetyStockDays));
            $reorderPoint = max($reorderPoint, 10);
            
            // Check if item needs reorder (quantity <= min_stock)
            if ($currentQty <= $reorderPoint) {
                $item['min_stock'] = $reorderPoint;
                $item['urgency_order'] = ($currentQty == 0) ? 1 : 2;
                $lowStockItems[] = $item;
            }
        }

        // 4. SORT BY URGENCY (out of stock first, then by quantity)
        usort($lowStockItems, function($a, $b) {
            if ($a['urgency_order'] != $b['urgency_order']) {
                return $a['urgency_order'] - $b['urgency_order'];
            }
            return $a['quantity'] - $b['quantity'];
        });

        // 5. LIMIT TO 10 ITEMS
        $lowStockItems = array_slice($lowStockItems, 0, 10);
        
        sendResponse(true, 'Low stock alerts retrieved successfully', $lowStockItems);
        
    } catch (PDOException $e) {
        sendResponse(false, 'Failed to retrieve low stock alerts: ' . $e->getMessage());
    }
}