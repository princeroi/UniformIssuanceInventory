-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Dec 23, 2025 at 08:01 AM
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
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `quantity_ordered` int(11) NOT NULL DEFAULT 0,
  `quantity_delivered` int(11) NOT NULL DEFAULT 0,
  `quantity_pending` int(11) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `deliveries`
--

INSERT INTO `deliveries` (`id`, `transaction_number`, `item_code`, `item_name`, `category`, `size`, `quantity`, `supplier`, `received_by`, `order_date`, `expected_date`, `delivery_status`, `delivered_date`, `notes`, `created_at`, `updated_at`, `quantity_ordered`, `quantity_delivered`, `quantity_pending`) VALUES
(11, 'DEL202512230001', 'S-B-T-Shirt', 'Small Blue T-Shirt', 'T-Shirt', 'S', 100, 'sample', 'sample', '2025-12-23', '2025-12-30', 'Delivered', '2025-12-23 14:59:38', '', '2025-12-23 06:59:16', '2025-12-23 06:59:38', 100, 100, 0);

-- --------------------------------------------------------

--
-- Table structure for table `delivery_history`
--

CREATE TABLE `delivery_history` (
  `id` int(11) NOT NULL,
  `delivery_id` int(11) NOT NULL,
  `transaction_number` varchar(50) DEFAULT NULL,
  `quantity_delivered` int(11) NOT NULL,
  `delivered_date` datetime DEFAULT current_timestamp(),
  `notes` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `delivery_history`
--

INSERT INTO `delivery_history` (`id`, `delivery_id`, `transaction_number`, `quantity_delivered`, `delivered_date`, `notes`) VALUES
(11, 11, 'DEL202512230001', 100, '2025-12-23 14:59:38', '');

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
  `site_assigned` varchar(100) DEFAULT NULL,
  `quantity` int(11) NOT NULL,
  `issued_date` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `issuance_items`
--

INSERT INTO `issuance_items` (`id`, `transaction_id`, `item_code`, `item_name`, `category`, `size`, `site_assigned`, `quantity`, `issued_date`) VALUES
(59, 'TXN-20251223-497346', 'S-B-T-Shirt', 'Small Blue T-Shirt', 'T-Shirt', 'S', 'Head Office', 2, '2025-12-23 15:00:17');

-- --------------------------------------------------------

--
-- Table structure for table `issuance_transactions`
--

CREATE TABLE `issuance_transactions` (
  `id` int(11) NOT NULL,
  `transaction_id` varchar(50) NOT NULL,
  `employee_name` varchar(255) NOT NULL,
  `issuance_type` enum('New Hire','Additional','Annual Issuance') NOT NULL,
  `site_assigned` varchar(100) DEFAULT NULL,
  `total_items` int(11) NOT NULL,
  `issued_by` varchar(255) DEFAULT NULL,
  `issued_by_id` varchar(50) DEFAULT NULL,
  `issuance_date` datetime DEFAULT current_timestamp(),
  `transaction_date` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `issuance_transactions`
--

INSERT INTO `issuance_transactions` (`id`, `transaction_id`, `employee_name`, `issuance_type`, `site_assigned`, `total_items`, `issued_by`, `issued_by_id`, `issuance_date`, `transaction_date`) VALUES
(57, 'TXN-20251223-497346', 'sample', 'New Hire', 'Head Office', 2, 'First Name Last Name', 'username', '2025-12-23 15:00:17', '2025-12-23 15:00:17');

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
(22, 'S-B-T-Shirt', 'item_694a3db0d515f4.27128345.jpg', 'Small Blue T-Shirt', 'T-Shirt', 'S', '', 98, 0, '2025-12-23 06:58:56', '2025-12-23 07:00:17');

-- --------------------------------------------------------

--
-- Table structure for table `layouts`
--

CREATE TABLE `layouts` (
  `id` int(10) UNSIGNED NOT NULL,
  `title` varchar(255) NOT NULL,
  `type` varchar(50) NOT NULL,
  `description` text DEFAULT NULL,
  `paper_size` varchar(20) DEFAULT 'A4',
  `orientation` varchar(20) DEFAULT 'portrait',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `layouts`
--

INSERT INTO `layouts` (`id`, `title`, `type`, `description`, `paper_size`, `orientation`, `created_at`, `updated_at`) VALUES
(1, 'Sample Invoice', 'invoice', 'This is a sample invoice layout', 'A4', 'portrait', '2025-12-17 01:09:22', '2025-12-17 01:09:22');

-- --------------------------------------------------------

--
-- Table structure for table `layout_elements`
--

CREATE TABLE `layout_elements` (
  `id` int(10) UNSIGNED NOT NULL,
  `layout_id` int(10) UNSIGNED NOT NULL,
  `elements_json` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT '[]' CHECK (json_valid(`elements_json`)),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `layout_elements`
--

INSERT INTO `layout_elements` (`id`, `layout_id`, `elements_json`, `created_at`, `updated_at`) VALUES
(1, 1, '[{\"type\":\"text\",\"x\":298,\"y\":92,\"width\":150,\"height\":50,\"content\":\"Editable text<div class=\\\"resize-handle se\\\"><\\/div><div class=\\\"resize-handle sw\\\"><\\/div><div class=\\\"resize-handle ne\\\"><\\/div><div class=\\\"resize-handle nw\\\"><\\/div>\"}]', '2025-12-17 01:09:22', '2025-12-17 01:51:33');

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
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `roles`
--

INSERT INTO `roles` (`id`, `role_name`, `description`, `created_at`) VALUES
(1, 'Administrator', 'Full system access - can manage all modules and users', '2025-12-02 03:39:33'),
(2, 'Manager', 'Can access all modules except settings', '2025-12-02 03:39:33'),
(3, 'Recruiter', 'Can only access POS for uniform issuance', '2025-12-22 07:58:54'),
(4, 'Supervisor', 'Can view all modules and issue uniforms via POS', '2025-12-02 03:39:33'),
(7, 'Admin Specialist', 'Provides administrative support by managing records, schedules, and daily office tasks.', '2025-12-23 06:40:04');

-- --------------------------------------------------------

--
-- Table structure for table `role_permissions`
--

CREATE TABLE `role_permissions` (
  `id` int(11) NOT NULL,
  `role_id` int(11) NOT NULL,
  `page_name` varchar(50) NOT NULL,
  `can_view` tinyint(1) DEFAULT 0,
  `can_add` tinyint(1) DEFAULT 0,
  `can_edit` tinyint(1) DEFAULT 0,
  `can_delete` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `role_permissions`
--

INSERT INTO `role_permissions` (`id`, `role_id`, `page_name`, `can_view`, `can_add`, `can_edit`, `can_delete`, `created_at`, `updated_at`) VALUES
(1, 1, 'dashboard', 1, 1, 1, 1, '2025-12-23 01:34:57', '2025-12-23 01:34:57'),
(2, 1, 'users', 1, 1, 1, 1, '2025-12-23 01:34:57', '2025-12-23 01:34:57'),
(3, 1, 'pos', 1, 1, 1, 1, '2025-12-23 01:34:57', '2025-12-23 01:34:57'),
(4, 1, 'inventory', 1, 1, 1, 1, '2025-12-23 01:34:57', '2025-12-23 01:34:57'),
(5, 1, 'issuance', 1, 1, 1, 1, '2025-12-23 01:34:57', '2025-12-23 01:34:57'),
(6, 1, 'deliveries', 1, 1, 1, 1, '2025-12-23 01:34:57', '2025-12-23 01:34:57'),
(7, 1, 'reports', 1, 1, 1, 1, '2025-12-23 01:34:57', '2025-12-23 01:34:57'),
(8, 1, 'history', 1, 1, 1, 1, '2025-12-23 01:34:57', '2025-12-23 01:34:57'),
(9, 1, 'settings', 1, 1, 1, 1, '2025-12-23 01:34:57', '2025-12-23 01:34:57'),
(10, 2, 'dashboard', 1, 1, 1, 1, '2025-12-23 01:34:57', '2025-12-23 01:34:57'),
(11, 2, 'users', 1, 1, 1, 1, '2025-12-23 01:34:57', '2025-12-23 01:34:57'),
(12, 2, 'pos', 1, 1, 1, 1, '2025-12-23 01:34:57', '2025-12-23 01:34:57'),
(13, 2, 'inventory', 1, 1, 1, 1, '2025-12-23 01:34:57', '2025-12-23 01:34:57'),
(14, 2, 'issuance', 1, 1, 1, 1, '2025-12-23 01:34:57', '2025-12-23 01:34:57'),
(15, 2, 'deliveries', 1, 1, 1, 1, '2025-12-23 01:34:57', '2025-12-23 01:34:57'),
(16, 2, 'reports', 1, 1, 1, 1, '2025-12-23 01:34:57', '2025-12-23 01:34:57'),
(17, 2, 'history', 1, 1, 1, 1, '2025-12-23 01:34:57', '2025-12-23 01:34:57'),
(19, 4, 'dashboard', 1, 0, 0, 0, '2025-12-23 01:34:57', '2025-12-23 01:34:57'),
(20, 4, 'users', 1, 0, 0, 0, '2025-12-23 01:34:57', '2025-12-23 01:34:57'),
(21, 4, 'pos', 1, 1, 1, 1, '2025-12-23 01:34:57', '2025-12-23 01:34:57'),
(22, 4, 'inventory', 1, 0, 0, 0, '2025-12-23 01:34:57', '2025-12-23 01:34:57'),
(23, 4, 'issuance', 1, 0, 0, 0, '2025-12-23 01:34:57', '2025-12-23 01:34:57'),
(24, 4, 'deliveries', 1, 0, 0, 0, '2025-12-23 01:34:57', '2025-12-23 01:34:57'),
(25, 4, 'reports', 1, 0, 0, 0, '2025-12-23 01:34:57', '2025-12-23 01:34:57'),
(26, 4, 'history', 1, 0, 0, 0, '2025-12-23 01:34:57', '2025-12-23 01:34:57'),
(71, 3, 'dashboard', 0, 0, 0, 0, '2025-12-23 06:32:33', '2025-12-23 06:32:33'),
(72, 3, 'users', 0, 0, 0, 0, '2025-12-23 06:32:33', '2025-12-23 06:32:33'),
(73, 3, 'pos', 1, 1, 1, 1, '2025-12-23 06:32:33', '2025-12-23 06:32:33'),
(74, 3, 'inventory', 0, 0, 0, 0, '2025-12-23 06:32:33', '2025-12-23 06:32:33'),
(75, 3, 'issuance', 1, 1, 1, 1, '2025-12-23 06:32:33', '2025-12-23 06:32:33'),
(76, 3, 'deliveries', 0, 0, 0, 0, '2025-12-23 06:32:33', '2025-12-23 06:32:33'),
(77, 3, 'reports', 0, 0, 0, 0, '2025-12-23 06:32:33', '2025-12-23 06:32:33'),
(78, 3, 'history', 0, 0, 0, 0, '2025-12-23 06:32:33', '2025-12-23 06:32:33'),
(79, 3, 'settings', 0, 0, 0, 0, '2025-12-23 06:32:33', '2025-12-23 06:32:33'),
(89, 7, 'dashboard', 1, 1, 1, 1, '2025-12-23 06:40:35', '2025-12-23 06:40:35'),
(90, 7, 'users', 0, 0, 0, 0, '2025-12-23 06:40:35', '2025-12-23 06:40:35'),
(91, 7, 'pos', 1, 1, 1, 1, '2025-12-23 06:40:35', '2025-12-23 06:40:35'),
(92, 7, 'inventory', 1, 1, 1, 1, '2025-12-23 06:40:35', '2025-12-23 06:40:35'),
(93, 7, 'issuance', 1, 1, 1, 1, '2025-12-23 06:40:35', '2025-12-23 06:40:35'),
(94, 7, 'deliveries', 1, 1, 1, 1, '2025-12-23 06:40:35', '2025-12-23 06:40:35'),
(95, 7, 'reports', 0, 0, 0, 0, '2025-12-23 06:40:35', '2025-12-23 06:40:35'),
(96, 7, 'history', 0, 0, 0, 0, '2025-12-23 06:40:35', '2025-12-23 06:40:35'),
(97, 7, 'settings', 0, 0, 0, 0, '2025-12-23 06:40:35', '2025-12-23 06:40:35');

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
(28, '00-0000', 'Prince Roi', 'Ocdamia', 'prince.stronglink@gmail.com', '$2y$10$xWsrs29cqMSZYVgDl5qkhupvtk7FKJbHC1pu8agqBc8McVPltqPIW', 1, 1, 'Active', '2025-12-23 14:44:54', '2025-12-23 01:02:00', '2025-12-23 06:44:54'),
(32, 'username', 'First Name', 'Last Name', 'email@gmail.com', '$2y$10$SpzyZULkZB.KjfgIe/EfUO2Qajb6FSYm.VC350r91gnXTtmrsdCY.', 2, 2, 'Active', '2025-12-23 14:47:54', '2025-12-23 06:42:40', '2025-12-23 06:47:54');

-- --------------------------------------------------------

--
-- Table structure for table `user_permissions`
--

CREATE TABLE `user_permissions` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `page_name` varchar(50) NOT NULL,
  `can_view` tinyint(1) DEFAULT 0,
  `can_add` tinyint(1) DEFAULT 0,
  `can_edit` tinyint(1) DEFAULT 0,
  `can_delete` tinyint(1) DEFAULT 0,
  `use_custom` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `user_permissions`
--

INSERT INTO `user_permissions` (`id`, `user_id`, `page_name`, `can_view`, `can_add`, `can_edit`, `can_delete`, `use_custom`, `created_at`, `updated_at`) VALUES
(89, 28, 'dashboard', 1, 1, 1, 1, 1, '2025-12-23 06:23:44', '2025-12-23 06:23:44'),
(90, 28, 'users', 1, 1, 1, 1, 1, '2025-12-23 06:23:44', '2025-12-23 06:23:44'),
(91, 28, 'roles', 1, 1, 1, 1, 1, '2025-12-23 06:23:44', '2025-12-23 06:23:44'),
(92, 28, 'pos', 1, 1, 1, 1, 1, '2025-12-23 06:23:44', '2025-12-23 06:23:44'),
(93, 28, 'inventory', 1, 1, 1, 1, 1, '2025-12-23 06:23:44', '2025-12-23 06:23:44'),
(94, 28, 'issuance', 1, 1, 1, 1, 1, '2025-12-23 06:23:44', '2025-12-23 06:23:44'),
(95, 28, 'deliveries', 1, 1, 1, 1, 1, '2025-12-23 06:23:44', '2025-12-23 06:23:44'),
(96, 28, 'reports', 1, 1, 1, 1, 1, '2025-12-23 06:23:44', '2025-12-23 06:23:44'),
(97, 28, 'history', 1, 1, 1, 1, 1, '2025-12-23 06:23:44', '2025-12-23 06:23:44'),
(98, 28, 'settings', 1, 1, 1, 1, 1, '2025-12-23 06:23:44', '2025-12-23 06:23:44'),
(134, 32, 'dashboard', 1, 1, 1, 1, 0, '2025-12-23 06:44:37', '2025-12-23 06:44:37'),
(135, 32, 'deliveries', 1, 1, 1, 1, 0, '2025-12-23 06:44:37', '2025-12-23 06:44:37'),
(136, 32, 'history', 1, 1, 1, 1, 0, '2025-12-23 06:44:37', '2025-12-23 06:44:37'),
(137, 32, 'inventory', 1, 1, 1, 1, 0, '2025-12-23 06:44:37', '2025-12-23 06:44:37'),
(138, 32, 'issuance', 1, 1, 1, 1, 0, '2025-12-23 06:44:37', '2025-12-23 06:44:37'),
(139, 32, 'pos', 1, 1, 1, 1, 0, '2025-12-23 06:44:37', '2025-12-23 06:44:37'),
(140, 32, 'reports', 1, 1, 1, 1, 0, '2025-12-23 06:44:37', '2025-12-23 06:44:37'),
(141, 32, 'users', 1, 1, 1, 1, 0, '2025-12-23 06:44:37', '2025-12-23 06:44:37');

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
-- Indexes for table `delivery_history`
--
ALTER TABLE `delivery_history`
  ADD PRIMARY KEY (`id`),
  ADD KEY `delivery_id` (`delivery_id`);

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
  ADD KEY `idx_item_code` (`item_code`),
  ADD KEY `idx_site_assigned` (`site_assigned`);

--
-- Indexes for table `issuance_transactions`
--
ALTER TABLE `issuance_transactions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `transaction_id` (`transaction_id`),
  ADD KEY `idx_transaction_id` (`transaction_id`),
  ADD KEY `idx_employee` (`employee_name`),
  ADD KEY `idx_date` (`transaction_date`),
  ADD KEY `idx_issuance_date` (`issuance_date`),
  ADD KEY `idx_site_assigned` (`site_assigned`);

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
-- Indexes for table `layouts`
--
ALTER TABLE `layouts`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `layout_elements`
--
ALTER TABLE `layout_elements`
  ADD PRIMARY KEY (`id`),
  ADD KEY `layout_id` (`layout_id`);

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
-- Indexes for table `role_permissions`
--
ALTER TABLE `role_permissions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_role_page` (`role_id`,`page_name`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_id` (`user_id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `department_id` (`department_id`),
  ADD KEY `fk_user_role` (`role_id`);

--
-- Indexes for table `user_permissions`
--
ALTER TABLE `user_permissions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_user_page` (`user_id`,`page_name`),
  ADD KEY `idx_user_custom` (`user_id`,`use_custom`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `deliveries`
--
ALTER TABLE `deliveries`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `delivery_history`
--
ALTER TABLE `delivery_history`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `departments`
--
ALTER TABLE `departments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `issuance_items`
--
ALTER TABLE `issuance_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=60;

--
-- AUTO_INCREMENT for table `issuance_transactions`
--
ALTER TABLE `issuance_transactions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=58;

--
-- AUTO_INCREMENT for table `items`
--
ALTER TABLE `items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=23;

--
-- AUTO_INCREMENT for table `layouts`
--
ALTER TABLE `layouts`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `layout_elements`
--
ALTER TABLE `layout_elements`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `login_logs`
--
ALTER TABLE `login_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `roles`
--
ALTER TABLE `roles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `role_permissions`
--
ALTER TABLE `role_permissions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=98;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=33;

--
-- AUTO_INCREMENT for table `user_permissions`
--
ALTER TABLE `user_permissions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=142;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `delivery_history`
--
ALTER TABLE `delivery_history`
  ADD CONSTRAINT `delivery_history_ibfk_1` FOREIGN KEY (`delivery_id`) REFERENCES `deliveries` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `issuance_items`
--
ALTER TABLE `issuance_items`
  ADD CONSTRAINT `issuance_items_ibfk_1` FOREIGN KEY (`transaction_id`) REFERENCES `issuance_transactions` (`transaction_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `issuance_items_ibfk_2` FOREIGN KEY (`item_code`) REFERENCES `items` (`item_code`) ON UPDATE CASCADE;

--
-- Constraints for table `layout_elements`
--
ALTER TABLE `layout_elements`
  ADD CONSTRAINT `layout_elements_ibfk_1` FOREIGN KEY (`layout_id`) REFERENCES `layouts` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `role_permissions`
--
ALTER TABLE `role_permissions`
  ADD CONSTRAINT `role_permissions_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `users_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `users_ibfk_2` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `user_permissions`
--
ALTER TABLE `user_permissions`
  ADD CONSTRAINT `user_permissions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
