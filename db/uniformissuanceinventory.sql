-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Dec 12, 2025 at 08:19 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `uniformissuanceinventory`
--

DELIMITER $$
--
-- Procedures
--
CREATE DEFINER=`` PROCEDURE `sp_update_all_min_stock` ()   BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE v_item_code VARCHAR(50);
    DECLARE v_yearly_usage INT;
    DECLARE v_daily_usage DECIMAL(10,2);
    DECLARE v_safety_stock INT;
    DECLARE v_reorder_point INT;
    DECLARE v_lead_time INT DEFAULT 30;
    DECLARE v_safety_days INT DEFAULT 7;
    
    DECLARE cur CURSOR FOR SELECT item_code FROM items;
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    OPEN cur;
    
    read_loop: LOOP
        FETCH cur INTO v_item_code;
        IF done THEN
            LEAVE read_loop;
        END IF;
        
        -- Calculate yearly usage from issuance_items
        SELECT COALESCE(SUM(ii.quantity), 0) INTO v_yearly_usage
        FROM issuance_items ii
        INNER JOIN issuance i ON ii.issuance_id = i.issuance_id
        WHERE ii.item_code = v_item_code
        AND i.issuance_date >= DATE_SUB(CURDATE(), INTERVAL 365 DAY);
        
        -- Calculate reorder point
        IF v_yearly_usage = 0 THEN
            SET v_reorder_point = 0;
        ELSE
            SET v_daily_usage = v_yearly_usage / 365;
            SET v_safety_stock = CEIL(v_daily_usage * v_safety_days);
            SET v_reorder_point = CEIL((v_daily_usage * v_lead_time) + v_safety_stock);
        END IF;
        
        -- Update the item
        UPDATE items 
        SET min_stock = v_reorder_point 
        WHERE item_code = v_item_code;
        
    END LOOP;
    
    CLOSE cur;
END$$

DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `deliveries`
--

CREATE TABLE `deliveries` (
  `id` int(11) NOT NULL,
  `transaction_number` varchar(50) NOT NULL,
  `item_code` varchar(50) NOT NULL,
  `item_name` varchar(255) NOT NULL,
  `category` varchar(100) NOT NULL,
  `size` varchar(50) NOT NULL,
  `quantity` int(11) NOT NULL,
  `supplier` varchar(255) NOT NULL,
  `received_by` varchar(255) NOT NULL,
  `order_date` date NOT NULL,
  `expected_date` date NOT NULL,
  `delivery_status` enum('Pending','Delivered') DEFAULT 'Pending',
  `delivered_date` datetime DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `deliveries`
--

INSERT INTO `deliveries` (`id`, `transaction_number`, `item_code`, `item_name`, `category`, `size`, `quantity`, `supplier`, `received_by`, `order_date`, `expected_date`, `delivery_status`, `delivered_date`, `notes`, `created_at`, `updated_at`) VALUES
(1, 'DEL202512110001', 'S-AB-T-SHIRT', 'SMALL AQUA BLUE T-SHIRT', 'T-Shirt', 'S', 50, 'SSI', 'SSI', '2025-12-11', '2025-12-18', 'Delivered', '2025-12-11 11:28:42', '', '2025-12-11 03:28:18', '2025-12-11 03:28:42'),
(2, 'DEL202512110002', 'S-AB-T-SHIRT', 'SMALL AQUA BLUE T-SHIRT', 'T-Shirt', 'S', 1, 'ssi', 'ssi', '2025-12-11', '2025-12-18', 'Delivered', '2025-12-11 12:00:29', '', '2025-12-11 04:00:20', '2025-12-11 04:00:29'),
(3, 'DEL202512110003', 'M-AB-T-SHIRT', 'Medium Aqua Blue T-Shirt', 'T-Shirt', 'M', 500, 'SSI', 'Prince', '2025-12-11', '2025-12-18', 'Delivered', '2025-12-11 14:41:28', '', '2025-12-11 06:41:24', '2025-12-11 06:41:28');

-- --------------------------------------------------------

--
-- Table structure for table `departments`
--

CREATE TABLE `departments` (
  `id` int(11) NOT NULL,
  `department_name` varchar(100) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `departments`
--

INSERT INTO `departments` (`id`, `department_name`, `created_at`) VALUES
(1, 'IT Department', '2025-12-02 03:39:33'),
(2, 'Human Resources', '2025-12-02 03:39:33'),
(4, 'Finance', '2025-12-02 03:39:33'),
(5, 'Operations', '2025-12-02 03:39:33');

-- --------------------------------------------------------

--
-- Table structure for table `issuance_items`
--

CREATE TABLE `issuance_items` (
  `id` int(11) NOT NULL,
  `transaction_id` varchar(50) NOT NULL,
  `item_code` varchar(50) NOT NULL,
  `item_name` varchar(255) NOT NULL,
  `category` varchar(100) DEFAULT NULL,
  `size` varchar(50) DEFAULT NULL,
  `quantity` int(11) NOT NULL,
  `issued_date` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `issuance_items`
--

INSERT INTO `issuance_items` (`id`, `transaction_id`, `item_code`, `item_name`, `category`, `size`, `quantity`, `issued_date`) VALUES
(2, 'TXN-20251211-015549', 'S-AB-T-SHIRT', 'SMALL AQUA BLUE T-SHIRT', 'T-Shirt', 'S', 4, '2025-12-11 11:31:21'),
(3, 'TXN-20251211-815741', 'S-AB-T-SHIRT', 'SMALL AQUA BLUE T-SHIRT', 'T-Shirt', 'S', 3, '2025-12-11 11:51:48'),
(4, 'TXN-20251211-952888', 'S-AB-T-SHIRT', 'SMALL AQUA BLUE T-SHIRT', 'T-Shirt', 'S', 3, '2025-12-11 11:53:06'),
(5, 'TXN-20251211-682034', 'S-AB-T-SHIRT', 'SMALL AQUA BLUE T-SHIRT', 'T-Shirt', 'S', 4, '2025-12-11 11:53:53'),
(6, 'TXN-20251211-082269', 'S-AB-T-SHIRT', 'SMALL AQUA BLUE T-SHIRT', 'T-Shirt', 'S', 1, '2025-12-11 11:55:57'),
(7, 'TXN-20251211-514986', 'S-AB-T-SHIRT', 'SMALL AQUA BLUE T-SHIRT', 'T-Shirt', 'S', 1, '2025-12-11 11:58:49'),
(8, 'TXN-20251211-812129', 'S-AB-T-SHIRT', 'SMALL AQUA BLUE T-SHIRT', 'T-Shirt', 'S', 8, '2025-12-11 13:11:50'),
(9, 'TXN-20251211-121016', 'S-AB-T-SHIRT', 'SMALL AQUA BLUE T-SHIRT', 'T-Shirt', 'S', 30, '2025-12-11 13:17:52'),
(10, 'TXN-20251211-005099', 'S-AB-T-SHIRT', 'SMALL AQUA BLUE T-SHIRT', 'T-Shirt', 'S', 2, '2025-12-11 13:22:08'),
(11, 'TXN-20251211-041961', 'S-AB-T-SHIRT', 'SMALL AQUA BLUE T-SHIRT', 'T-Shirt', 'S', 5, '2025-12-11 13:53:45'),
(12, 'TXN-20251211-332295', 'S-AB-T-SHIRT', 'SMALL AQUA BLUE T-SHIRT', 'T-Shirt', 'S', 30, '2025-12-11 14:01:14'),
(13, 'TXN-20251211-953960', 'S-AB-T-SHIRT', 'SMALL AQUA BLUE T-SHIRT', 'T-Shirt', 'S', 400, '2025-12-11 14:01:44'),
(14, 'TXN-20251211-828834', 'S-AB-T-SHIRT', 'SMALL AQUA BLUE T-SHIRT', 'T-Shirt', 'S', 1, '2025-12-11 14:03:55'),
(15, 'TXN-20251211-998768', 'M-AB-T-SHIRT', 'Medium Aqua Blue T-Shirt', 'T-Shirt', 'M', 400, '2025-12-11 14:41:49'),
(16, 'TXN-20251211-096872', 'M-AB-T-SHIRT', 'Medium Aqua Blue T-Shirt', 'T-Shirt', 'M', 1, '2025-12-11 16:26:06');

-- --------------------------------------------------------

--
-- Table structure for table `issuance_transactions`
--

CREATE TABLE `issuance_transactions` (
  `id` int(11) NOT NULL,
  `transaction_id` varchar(50) NOT NULL,
  `employee_name` varchar(255) NOT NULL,
  `issuance_type` enum('New Hire','Additional','Annual Issuance') NOT NULL,
  `total_items` int(11) NOT NULL,
  `issued_by` varchar(255) DEFAULT NULL,
  `issuance_date` datetime DEFAULT current_timestamp(),
  `transaction_date` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `issuance_transactions`
--

INSERT INTO `issuance_transactions` (`id`, `transaction_id`, `employee_name`, `issuance_type`, `total_items`, `issued_by`, `issuance_date`, `transaction_date`) VALUES
(2, 'TXN-20251211-015549', 'Prince', 'New Hire', 4, 'System', '2025-12-11 11:31:21', '2025-12-11 11:31:21'),
(3, 'TXN-20251211-815741', 'Prince', 'New Hire', 3, 'System', '2025-12-11 11:51:48', '2025-12-11 11:51:48'),
(4, 'TXN-20251211-952888', 'Prince', 'New Hire', 3, 'System', '2025-12-11 11:53:06', '2025-12-11 11:53:06'),
(5, 'TXN-20251211-682034', 'Prince', 'New Hire', 4, 'System', '2025-12-11 11:53:53', '2025-12-11 11:53:53'),
(6, 'TXN-20251211-082269', 'Prince', 'New Hire', 1, 'System', '2025-12-11 11:55:57', '2025-12-11 11:55:57'),
(7, 'TXN-20251211-514986', 'aira', 'New Hire', 1, 'System', '2025-12-11 11:58:49', '2025-12-11 11:58:49'),
(8, 'TXN-20251211-812129', 'Prince', 'New Hire', 8, 'System', '2025-12-11 13:11:50', '2025-12-11 13:11:50'),
(9, 'TXN-20251211-121016', 'Prince', 'New Hire', 30, 'System', '2025-12-11 13:17:52', '2025-12-11 13:17:52'),
(10, 'TXN-20251211-005099', 'Prince', 'New Hire', 2, 'System', '2025-12-11 13:22:08', '2025-12-11 13:22:08'),
(11, 'TXN-20251211-041961', 'Prince', 'New Hire', 5, 'System', '2025-12-11 13:53:45', '2025-12-11 13:53:45'),
(12, 'TXN-20251211-332295', 'Prince', 'New Hire', 30, 'System', '2025-12-11 14:01:14', '2025-12-11 14:01:14'),
(13, 'TXN-20251211-953960', 'Prince', 'New Hire', 400, 'System', '2025-12-11 14:01:44', '2025-12-11 14:01:44'),
(14, 'TXN-20251211-828834', 'Prince', 'New Hire', 1, 'System', '2025-12-11 14:03:55', '2025-12-11 14:03:55'),
(15, 'TXN-20251211-998768', 'Prince', 'New Hire', 400, 'System', '2025-12-11 14:41:49', '2025-12-11 14:41:49'),
(16, 'TXN-20251211-096872', 'Prince', 'New Hire', 1, 'System', '2025-12-11 16:26:06', '2025-12-11 16:26:06');

-- --------------------------------------------------------

--
-- Table structure for table `items`
--

CREATE TABLE `items` (
  `id` int(11) NOT NULL,
  `item_code` varchar(50) NOT NULL,
  `image_path` varchar(255) DEFAULT NULL,
  `item_name` varchar(255) NOT NULL,
  `category` varchar(100) NOT NULL,
  `size` varchar(50) NOT NULL,
  `description` text DEFAULT NULL,
  `quantity` int(11) DEFAULT 0,
  `min_stock` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `items`
--

INSERT INTO `items` (`id`, `item_code`, `image_path`, `item_name`, `category`, `size`, `description`, `quantity`, `min_stock`, `created_at`, `updated_at`) VALUES
(7, 'S-AB-T-SHIRT', 'item_693a25018f7276.90245767.jpg', 'SMALL AQUA BLUE T-SHIRT', 'T-Shirt', 'S', '', 99, 10, '2025-12-11 01:57:21', '2025-12-11 06:03:55'),
(15, 'M-AB-T-SHIRT', 'item_693a67792ee449.21908702.jpg', 'Medium Aqua Blue T-Shirt', 'T-Shirt', 'M', '', 99, 0, '2025-12-11 06:40:57', '2025-12-11 08:26:06');

-- --------------------------------------------------------

--
-- Table structure for table `login_logs`
--

CREATE TABLE `login_logs` (
  `id` int(11) NOT NULL,
  `username` varchar(100) NOT NULL,
  `success` tinyint(1) NOT NULL DEFAULT 0,
  `message` varchar(255) DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `roles`
--

CREATE TABLE `roles` (
  `id` int(11) NOT NULL,
  `role_name` varchar(50) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `roles`
--

INSERT INTO `roles` (`id`, `role_name`, `created_at`) VALUES
(1, 'Administrator', '2025-12-02 03:39:33'),
(2, 'Manager', '2025-12-02 03:39:33'),
(4, 'Supervisor', '2025-12-02 03:39:33');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `user_id` varchar(10) NOT NULL,
  `first_name` varchar(50) NOT NULL,
  `last_name` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role_id` int(11) DEFAULT NULL,
  `department_id` int(11) DEFAULT NULL,
  `status` enum('Active','Inactive') DEFAULT 'Active',
  `last_login` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `user_id`, `first_name`, `last_name`, `email`, `password`, `role_id`, `department_id`, `status`, `last_login`, `created_at`, `updated_at`) VALUES
(23, '00-0001', 'Prince Roi', 'Ocdamia', 'princeroibocdamia@gmail.com', '$2y$10$39hRPXDmsar/JvDtMm7sBuQCkaWuLjqrc9zlvBVVRV3771SeNEsEu', 1, 1, 'Inactive', NULL, '2025-12-10 03:29:57', '2025-12-10 03:33:59');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `deliveries`
--
ALTER TABLE `deliveries`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `transaction_number` (`transaction_number`);

--
-- Indexes for table `departments`
--
ALTER TABLE `departments`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `department_name` (`department_name`);

--
-- Indexes for table `issuance_items`
--
ALTER TABLE `issuance_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_transaction` (`transaction_id`),
  ADD KEY `idx_item_code` (`item_code`);

--
-- Indexes for table `issuance_transactions`
--
ALTER TABLE `issuance_transactions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `transaction_id` (`transaction_id`),
  ADD KEY `idx_transaction_id` (`transaction_id`),
  ADD KEY `idx_employee` (`employee_name`),
  ADD KEY `idx_date` (`transaction_date`),
  ADD KEY `idx_issuance_date` (`issuance_date`);

--
-- Indexes for table `items`
--
ALTER TABLE `items`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `item_code` (`item_code`),
  ADD UNIQUE KEY `item_name` (`item_name`),
  ADD KEY `idx_item_code` (`item_code`),
  ADD KEY `idx_item_name` (`item_name`),
  ADD KEY `idx_category` (`category`);

--
-- Indexes for table `login_logs`
--
ALTER TABLE `login_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_username` (`username`),
  ADD KEY `idx_created_at` (`created_at`);

--
-- Indexes for table `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `role_name` (`role_name`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_id` (`user_id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `role_id` (`role_id`),
  ADD KEY `department_id` (`department_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `deliveries`
--
ALTER TABLE `deliveries`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `departments`
--
ALTER TABLE `departments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `issuance_items`
--
ALTER TABLE `issuance_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT for table `issuance_transactions`
--
ALTER TABLE `issuance_transactions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT for table `items`
--
ALTER TABLE `items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT for table `login_logs`
--
ALTER TABLE `login_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `roles`
--
ALTER TABLE `roles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=24;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `issuance_items`
--
ALTER TABLE `issuance_items`
  ADD CONSTRAINT `issuance_items_ibfk_1` FOREIGN KEY (`transaction_id`) REFERENCES `issuance_transactions` (`transaction_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `issuance_items_ibfk_2` FOREIGN KEY (`item_code`) REFERENCES `items` (`item_code`) ON UPDATE CASCADE;

--
-- Constraints for table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `users_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `users_ibfk_2` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
