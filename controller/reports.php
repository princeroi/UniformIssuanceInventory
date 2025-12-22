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
        case 'getInventoryReport':
            getInventoryReport($pdo);
            break;
            
        case 'getIssuanceReport':
            getIssuanceReport($pdo);
            break;
            
        case 'getDeliveryReport':
            getDeliveryReport($pdo);
            break;
            
        case 'getEmployeeReport':
            getEmployeeReport($pdo);
            break;
            
        case 'getFinancialReport':
            getFinancialReport($pdo);
            break;
            
        case 'getRecentReports':
            getRecentReports($pdo);
            break;
            
        default:
            sendResponse(false, "Invalid action");
            break;
    }
} catch (PDOException $e) {
    sendResponse(false, "Database error: " . $e->getMessage());
}

/**
 * Generate Inventory Report
 */
function getInventoryReport($pdo) {
    try {
        $category = $_GET['category'] ?? 'all';
        $includeLowStock = $_GET['include_low_stock'] ?? 'true';
        $includeOutOfStock = $_GET['include_out_of_stock'] ?? 'true';
        
        // Base query
        $query = "SELECT 
            item_code,
            item_name,
            category,
            size,
            quantity,
            min_stock,
            image_path,
            created_at,
            updated_at
        FROM items WHERE 1=1";
        
        $params = [];
        
        // Apply category filter
        if ($category !== 'all') {
            $query .= " AND category = ?";
            $params[] = $category;
        }
        
        $query .= " ORDER BY category, item_name";
        
        $stmt = $pdo->prepare($query);
        $stmt->execute($params);
        $items = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Get usage data for reorder point calculation
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
        
        // Calculate reorder points and filter
        $reportItems = [];
        $totalItems = 0;
        $lowStockCount = 0;
        $outOfStockCount = 0;
        $normalStockCount = 0;
        
        foreach ($items as $item) {
            $code = $item['item_code'];
            $currentQty = intval($item['quantity']);
            
            // Calculate reorder point
            $last3MonthsUsage = $usageData[$code] ?? 0;
            $dailyUsage = $last3MonthsUsage > 0 ? $last3MonthsUsage / 90 : 0;
            $reorderPoint = max(round($dailyUsage * 37), 10);
            
            $item['reorder_point'] = $reorderPoint;
            $item['status'] = 'Normal';
            
            if ($currentQty == 0) {
                $item['status'] = 'Out of Stock';
                $outOfStockCount++;
            } elseif ($currentQty <= $reorderPoint) {
                $item['status'] = 'Low Stock';
                $lowStockCount++;
            } else {
                $normalStockCount++;
            }
            
            // Apply filters
            if ($includeLowStock === 'false' && $item['status'] === 'Low Stock') {
                continue;
            }
            if ($includeOutOfStock === 'false' && $item['status'] === 'Out of Stock') {
                continue;
            }
            
            $reportItems[] = $item;
            $totalItems++;
        }
        
        // Summary statistics
        $summary = [
            'total_items' => $totalItems,
            'low_stock_count' => $lowStockCount,
            'out_of_stock_count' => $outOfStockCount,
            'normal_stock_count' => $normalStockCount,
            'report_date' => date('Y-m-d H:i:s'),
            'category' => $category === 'all' ? 'All Categories' : $category
        ];
        
        sendResponse(true, 'Inventory report generated successfully', [
            'items' => $reportItems,
            'summary' => $summary
        ]);
        
    } catch (PDOException $e) {
        sendResponse(false, 'Failed to generate inventory report: ' . $e->getMessage());
    }
}

/**
 * Generate Issuance Report
 */
function getIssuanceReport($pdo) {
    try {
        $dateFrom = $_GET['date_from'] ?? date('Y-m-01');
        $dateTo = $_GET['date_to'] ?? date('Y-m-d');
        $issuanceType = $_GET['issuance_type'] ?? 'all';
        $site = $_GET['site'] ?? 'all';
        
        // Build query - Join issuance_items with issuance_transactions
        $query = "SELECT 
            it.transaction_id,
            it.employee_name,
            it.issuance_type,
            it.site_assigned,
            it.issued_by,
            it.issuance_date,
            ii.item_code,
            ii.item_name,
            ii.category,
            ii.size,
            ii.quantity,
            ii.issued_date
        FROM issuance_transactions it
        INNER JOIN issuance_items ii ON it.transaction_id = ii.transaction_id
        WHERE it.issuance_date BETWEEN ? AND ?";
        
        $params = [$dateFrom, $dateTo];
        
        if ($issuanceType !== 'all') {
            $query .= " AND it.issuance_type = ?";
            $params[] = $issuanceType;
        }
        
        if ($site !== 'all') {
            $query .= " AND it.site_assigned = ?";
            $params[] = $site;
        }
        
        $query .= " ORDER BY it.issuance_date DESC, it.transaction_id";
        
        $stmt = $pdo->prepare($query);
        $stmt->execute($params);
        $issuances = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Calculate summary
        $totalTransactions = 0;
        $totalItems = 0;
        $byCategory = [];
        $byType = [];
        $bySite = [];
        $seenTransactions = [];
        
        foreach ($issuances as $issuance) {
            $txnId = $issuance['transaction_id'];
            
            // Count unique transactions
            if (!in_array($txnId, $seenTransactions)) {
                $totalTransactions++;
                $seenTransactions[] = $txnId;
            }
            
            $totalItems += intval($issuance['quantity']);
            
            // By category
            $cat = $issuance['category'];
            if (!isset($byCategory[$cat])) {
                $byCategory[$cat] = ['count' => 0, 'quantity' => 0];
            }
            $byCategory[$cat]['count']++;
            $byCategory[$cat]['quantity'] += intval($issuance['quantity']);
            
            // By type
            $type = $issuance['issuance_type'];
            if (!isset($byType[$type])) {
                $byType[$type] = ['count' => 0, 'quantity' => 0];
            }
            $byType[$type]['count']++;
            $byType[$type]['quantity'] += intval($issuance['quantity']);
            
            // By site
            $site = $issuance['site_assigned'] ?? 'N/A';
            if (!isset($bySite[$site])) {
                $bySite[$site] = ['count' => 0, 'quantity' => 0];
            }
            $bySite[$site]['count']++;
            $bySite[$site]['quantity'] += intval($issuance['quantity']);
        }
        
        $summary = [
            'total_transactions' => $totalTransactions,
            'total_items_issued' => $totalItems,
            'date_from' => $dateFrom,
            'date_to' => $dateTo,
            'by_category' => $byCategory,
            'by_type' => $byType,
            'by_site' => $bySite,
            'report_date' => date('Y-m-d H:i:s')
        ];
        
        sendResponse(true, 'Issuance report generated successfully', [
            'issuances' => $issuances,
            'summary' => $summary
        ]);
        
    } catch (PDOException $e) {
        sendResponse(false, 'Failed to generate issuance report: ' . $e->getMessage());
    }
}

/**
 * Generate Delivery Report
 */
function getDeliveryReport($pdo) {
    try {
        $dateFrom = $_GET['date_from'] ?? date('Y-m-01');
        $dateTo = $_GET['date_to'] ?? date('Y-m-d');
        $supplier = $_GET['supplier'] ?? 'all';
        $status = $_GET['status'] ?? 'all';
        
        $query = "SELECT 
            id,
            transaction_number,
            item_code,
            item_name,
            category,
            size,
            quantity,
            quantity_ordered,
            quantity_delivered,
            quantity_pending,
            supplier,
            received_by,
            order_date,
            expected_date,
            delivered_date,
            delivery_status,
            notes,
            created_at
        FROM deliveries
        WHERE order_date BETWEEN ? AND ?";
        
        $params = [$dateFrom, $dateTo];
        
        if ($supplier !== 'all') {
            $query .= " AND supplier = ?";
            $params[] = $supplier;
        }
        
        if ($status !== 'all') {
            $query .= " AND delivery_status = ?";
            $params[] = $status;
        }
        
        $query .= " ORDER BY order_date DESC, transaction_number";
        
        $stmt = $pdo->prepare($query);
        $stmt->execute($params);
        $deliveries = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Calculate summary
        $totalDeliveries = count($deliveries);
        $totalItemsOrdered = 0;
        $totalItemsDelivered = 0;
        $totalItemsPending = 0;
        $bySupplier = [];
        $byStatus = [];
        
        foreach ($deliveries as $delivery) {
            $totalItemsOrdered += intval($delivery['quantity_ordered']);
            $totalItemsDelivered += intval($delivery['quantity_delivered']);
            $totalItemsPending += intval($delivery['quantity_pending']);
            
            // By supplier
            $sup = $delivery['supplier'];
            if (!isset($bySupplier[$sup])) {
                $bySupplier[$sup] = [
                    'deliveries' => 0,
                    'ordered' => 0,
                    'delivered' => 0,
                    'pending' => 0
                ];
            }
            $bySupplier[$sup]['deliveries']++;
            $bySupplier[$sup]['ordered'] += intval($delivery['quantity_ordered']);
            $bySupplier[$sup]['delivered'] += intval($delivery['quantity_delivered']);
            $bySupplier[$sup]['pending'] += intval($delivery['quantity_pending']);
            
            // By status
            $status = $delivery['delivery_status'];
            if (!isset($byStatus[$status])) {
                $byStatus[$status] = 0;
            }
            $byStatus[$status]++;
        }
        
        $summary = [
            'total_deliveries' => $totalDeliveries,
            'total_items_ordered' => $totalItemsOrdered,
            'total_items_delivered' => $totalItemsDelivered,
            'total_items_pending' => $totalItemsPending,
            'date_from' => $dateFrom,
            'date_to' => $dateTo,
            'by_supplier' => $bySupplier,
            'by_status' => $byStatus,
            'report_date' => date('Y-m-d H:i:s')
        ];
        
        sendResponse(true, 'Delivery report generated successfully', [
            'deliveries' => $deliveries,
            'summary' => $summary
        ]);
        
    } catch (PDOException $e) {
        sendResponse(false, 'Failed to generate delivery report: ' . $e->getMessage());
    }
}

/**
 * Generate Employee Report
 */
function getEmployeeReport($pdo) {
    try {
        $dateFrom = $_GET['date_from'] ?? date('Y-m-01');
        $dateTo = $_GET['date_to'] ?? date('Y-m-d');
        
        // Get all employees with their issuances
        $query = "SELECT 
            it.employee_name,
            it.site_assigned,
            COUNT(DISTINCT it.transaction_id) as total_transactions,
            COUNT(ii.id) as total_items_count,
            SUM(ii.quantity) as total_quantity,
            MAX(it.issuance_date) as last_issuance_date,
            GROUP_CONCAT(DISTINCT ii.category) as categories_received
        FROM issuance_transactions it
        LEFT JOIN issuance_items ii ON it.transaction_id = ii.transaction_id
        WHERE it.issuance_date BETWEEN ? AND ?
        GROUP BY it.employee_name, it.site_assigned
        ORDER BY total_quantity DESC";
        
        $stmt = $pdo->prepare($query);
        $stmt->execute([$dateFrom, $dateTo]);
        $employees = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Summary
        $totalEmployees = count($employees);
        $totalTransactions = 0;
        $totalItemsIssued = 0;
        $bySite = [];
        
        foreach ($employees as $emp) {
            $totalTransactions += intval($emp['total_transactions']);
            $totalItemsIssued += intval($emp['total_quantity']);
            
            // By site
            $site = $emp['site_assigned'] ?? 'N/A';
            if (!isset($bySite[$site])) {
                $bySite[$site] = ['employees' => 0, 'items' => 0];
            }
            $bySite[$site]['employees']++;
            $bySite[$site]['items'] += intval($emp['total_quantity']);
        }
        
        $summary = [
            'total_employees' => $totalEmployees,
            'total_transactions' => $totalTransactions,
            'total_items_issued' => $totalItemsIssued,
            'by_site' => $bySite,
            'date_from' => $dateFrom,
            'date_to' => $dateTo,
            'report_date' => date('Y-m-d H:i:s')
        ];
        
        sendResponse(true, 'Employee report generated successfully', [
            'employees' => $employees,
            'summary' => $summary
        ]);
        
    } catch (PDOException $e) {
        sendResponse(false, 'Failed to generate employee report: ' . $e->getMessage());
    }
}

/**
 * Generate Financial Report (Simplified - based on quantity only)
 */
function getFinancialReport($pdo) {
    try {
        $dateFrom = $_GET['date_from'] ?? date('Y-m-01');
        $dateTo = $_GET['date_to'] ?? date('Y-m-d');
        
        // Issuance counts by date
        $issuanceQuery = "SELECT 
            DATE(issuance_date) as date,
            SUM(quantity) as daily_quantity,
            COUNT(*) as items_count
        FROM issuance_items
        WHERE issued_date BETWEEN ? AND ?
        GROUP BY DATE(issuance_date)
        ORDER BY date";
        
        $stmt = $pdo->prepare($issuanceQuery);
        $stmt->execute([$dateFrom, $dateTo]);
        $issuanceData = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Delivery counts by date
        $deliveryQuery = "SELECT 
            DATE(order_date) as date,
            SUM(quantity_ordered) as daily_quantity,
            SUM(quantity_delivered) as delivered_quantity,
            COUNT(*) as deliveries_count
        FROM deliveries
        WHERE order_date BETWEEN ? AND ?
        GROUP BY DATE(order_date)
        ORDER BY date";
        
        $stmt = $pdo->prepare($deliveryQuery);
        $stmt->execute([$dateFrom, $dateTo]);
        $deliveryData = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Calculate totals
        $totalItemsIssued = array_sum(array_column($issuanceData, 'daily_quantity'));
        $totalItemsOrdered = array_sum(array_column($deliveryData, 'daily_quantity'));
        $totalItemsDelivered = array_sum(array_column($deliveryData, 'delivered_quantity'));
        
        // Current inventory count
        $inventoryStmt = $pdo->query("SELECT SUM(quantity) as total FROM items");
        $currentInventory = $inventoryStmt->fetchColumn() ?: 0;
        
        $summary = [
            'total_items_issued' => $totalItemsIssued,
            'total_items_ordered' => $totalItemsOrdered,
            'total_items_delivered' => $totalItemsDelivered,
            'current_inventory' => $currentInventory,
            'net_change' => $totalItemsDelivered - $totalItemsIssued,
            'date_from' => $dateFrom,
            'date_to' => $dateTo,
            'report_date' => date('Y-m-d H:i:s')
        ];
        
        sendResponse(true, 'Financial report generated successfully', [
            'issuance_data' => $issuanceData,
            'delivery_data' => $deliveryData,
            'summary' => $summary
        ]);
        
    } catch (PDOException $e) {
        sendResponse(false, 'Failed to generate financial report: ' . $e->getMessage());
    }
}

/**
 * Get recent reports history
 */
function getRecentReports($pdo) {
    try {
        // Sample recent reports (you can create a reports_history table later)
        $reports = [
            [
                'id' => 1,
                'report_name' => 'Monthly Inventory Summary',
                'report_type' => 'Inventory',
                'generated_date' => date('Y-m-d', strtotime('-1 day')),
                'generated_by' => 'System Admin',
                'period' => date('F Y', strtotime('-1 month'))
            ],
            [
                'id' => 2,
                'report_name' => 'Issuance Report - This Month',
                'report_type' => 'Issuance',
                'generated_date' => date('Y-m-d', strtotime('-2 days')),
                'generated_by' => 'System Admin',
                'period' => date('F Y')
            ],
            [
                'id' => 3,
                'report_name' => 'Delivery Performance Report',
                'report_type' => 'Delivery',
                'generated_date' => date('Y-m-d', strtotime('-3 days')),
                'generated_by' => 'System Admin',
                'period' => date('F Y')
            ]
        ];
        
        sendResponse(true, 'Recent reports retrieved successfully', $reports);
        
    } catch (Exception $e) {
        sendResponse(false, 'Failed to retrieve recent reports: ' . $e->getMessage());
    }
}