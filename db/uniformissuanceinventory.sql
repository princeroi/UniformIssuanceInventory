-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Dec 23, 2025 at 07:51 AM
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
(1, 'DEL202512110001', 'S-AB-T-SHIRT', 'SMALL AQUA BLUE T-SHIRT', 'T-Shirt', 'S', 50, 'SSI', 'SSI', '2025-12-11', '2025-12-18', 'Delivered', '2025-12-11 11:28:42', '', '2025-12-11 03:28:18', '2025-12-16 01:07:02', 50, 50, 0),
(2, 'DEL202512110002', 'S-AB-T-SHIRT', 'SMALL AQUA BLUE T-SHIRT', 'T-Shirt', 'S', 1, 'ssi', 'ssi', '2025-12-11', '2025-12-18', 'Delivered', '2025-12-11 12:00:29', '', '2025-12-11 04:00:20', '2025-12-16 01:07:02', 1, 1, 0),
(3, 'DEL202512110003', 'M-AB-T-SHIRT', 'Medium Aqua Blue T-Shirt', 'T-Shirt', 'M', 500, 'SSI', 'Prince', '2025-12-11', '2025-12-18', 'Delivered', '2025-12-11 14:41:28', '', '2025-12-11 06:41:24', '2025-12-16 01:07:02', 500, 500, 0),
(4, 'DEL202512160001', 'M-AB-T-SHIRT', 'Medium Aqua Blue T-Shirt', 'T-Shirt', 'M', 1, 'Ms. Eppie', 'Aira', '2025-12-16', '2025-12-23', 'Delivered', '2025-12-16 09:11:42', '', '2025-12-16 01:08:36', '2025-12-16 01:11:42', 1, 1, 0),
(5, 'DEL202512160002', 'M-AB-T-SHIRT', 'Medium Aqua Blue T-Shirt', 'T-Shirt', 'M', 50, 'Ms. Eppie', 'Aira', '2025-12-16', '2025-12-23', 'Delivered', '2025-12-16 09:12:12', '', '2025-12-16 01:12:05', '2025-12-16 01:12:12', 50, 50, 0),
(6, 'DEL202512160003', 'S-AB-T-SHIRT', 'SMALL AQUA BLUE T-SHIRT', 'T-Shirt', 'S', 50, 'Ms. Eppie', 'Aira', '2025-12-16', '2025-12-23', '', NULL, '', '2025-12-16 01:12:48', '2025-12-16 06:23:02', 50, 45, 5),
(7, 'DEL202512160004', 'M-AB-T-SHIRT', 'Medium Aqua Blue T-Shirt', 'T-Shirt', 'M', 1, 'SSI', 'Prince', '2025-12-16', '2025-12-23', 'Delivered', '2025-12-23 08:21:23', '', '2025-12-16 06:22:06', '2025-12-23 00:21:23', 1, 1, 0),
(8, 'DEL202512170001', 'S-AB-T-SHIRT', 'SMALL AQUA BLUE T-SHIRT', 'T-Shirt', 'S', 100, 'Ms Eppie', 'Prince', '2025-12-17', '2025-12-24', '', NULL, '', '2025-12-17 06:58:47', '2025-12-23 00:21:53', 100, 80, 20),
(9, 'DEL202512230001', 'S-AB-T-SHIRT', 'SMALL AQUA BLUE T-SHIRT', 'T-Shirt', 'S', 40, 'SSI', 'Prince', '2025-12-23', '2025-12-30', 'Pending', NULL, '', '2025-12-23 05:16:32', '2025-12-23 05:16:32', 40, 0, 40),
(10, 'DEL202512230002', 'Medium-AB-T-SHIRT', 'Medium Aqua Blue T-Shirt', 'T-Shirt', 'M', 100, 'SAMPLE', 'SAMPLE', '2025-12-23', '2025-12-30', 'Delivered', '2025-12-23 14:34:32', '', '2025-12-23 06:34:19', '2025-12-23 06:34:32', 100, 100, 0);

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
(1, 4, 'DEL202512160001', 1, '2025-12-16 09:11:42', ''),
(2, 5, 'DEL202512160002', 50, '2025-12-16 09:12:12', ''),
(3, 6, 'DEL202512160003', 30, '2025-12-16 09:12:56', ''),
(4, 6, 'DEL202512160003', 5, '2025-12-16 09:13:19', ''),
(5, 6, 'DEL202512160003', 10, '2025-12-16 14:23:02', ''),
(6, 8, 'DEL202512170001', 50, '2025-12-17 14:59:36', ''),
(7, 8, 'DEL202512170001', 25, '2025-12-17 15:10:42', ''),
(8, 7, 'DEL202512160004', 1, '2025-12-23 08:21:23', ''),
(9, 8, 'DEL202512170001', 5, '2025-12-23 08:21:53', ''),
(10, 10, 'DEL202512230002', 100, '2025-12-23 14:34:32', '');

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
(2, 'TXN-20251211-015549', 'S-AB-T-SHIRT', 'SMALL AQUA BLUE T-SHIRT', 'T-Shirt', 'S', NULL, 4, '2025-12-11 11:31:21'),
(3, 'TXN-20251211-815741', 'S-AB-T-SHIRT', 'SMALL AQUA BLUE T-SHIRT', 'T-Shirt', 'S', NULL, 3, '2025-12-11 11:51:48'),
(4, 'TXN-20251211-952888', 'S-AB-T-SHIRT', 'SMALL AQUA BLUE T-SHIRT', 'T-Shirt', 'S', NULL, 3, '2025-12-11 11:53:06'),
(5, 'TXN-20251211-682034', 'S-AB-T-SHIRT', 'SMALL AQUA BLUE T-SHIRT', 'T-Shirt', 'S', NULL, 4, '2025-12-11 11:53:53'),
(6, 'TXN-20251211-082269', 'S-AB-T-SHIRT', 'SMALL AQUA BLUE T-SHIRT', 'T-Shirt', 'S', NULL, 1, '2025-12-11 11:55:57'),
(7, 'TXN-20251211-514986', 'S-AB-T-SHIRT', 'SMALL AQUA BLUE T-SHIRT', 'T-Shirt', 'S', NULL, 1, '2025-12-11 11:58:49'),
(8, 'TXN-20251211-812129', 'S-AB-T-SHIRT', 'SMALL AQUA BLUE T-SHIRT', 'T-Shirt', 'S', NULL, 8, '2025-12-11 13:11:50'),
(9, 'TXN-20251211-121016', 'S-AB-T-SHIRT', 'SMALL AQUA BLUE T-SHIRT', 'T-Shirt', 'S', NULL, 30, '2025-12-11 13:17:52'),
(10, 'TXN-20251211-005099', 'S-AB-T-SHIRT', 'SMALL AQUA BLUE T-SHIRT', 'T-Shirt', 'S', NULL, 2, '2025-12-11 13:22:08'),
(11, 'TXN-20251211-041961', 'S-AB-T-SHIRT', 'SMALL AQUA BLUE T-SHIRT', 'T-Shirt', 'S', NULL, 5, '2025-12-11 13:53:45'),
(12, 'TXN-20251211-332295', 'S-AB-T-SHIRT', 'SMALL AQUA BLUE T-SHIRT', 'T-Shirt', 'S', NULL, 30, '2025-12-11 14:01:14'),
(13, 'TXN-20251211-953960', 'S-AB-T-SHIRT', 'SMALL AQUA BLUE T-SHIRT', 'T-Shirt', 'S', NULL, 400, '2025-12-11 14:01:44'),
(14, 'TXN-20251211-828834', 'S-AB-T-SHIRT', 'SMALL AQUA BLUE T-SHIRT', 'T-Shirt', 'S', NULL, 1, '2025-12-11 14:03:55'),
(18, 'TXN-20251216-231071', 'S-AB-T-SHIRT', 'SMALL AQUA BLUE T-SHIRT', 'T-Shirt', 'S', NULL, 1, '2025-12-16 09:39:15'),
(20, 'TXN-20251217-101561', 'S-AB-T-SHIRT', 'SMALL AQUA BLUE T-SHIRT', 'T-Shirt', 'S', 'Head Office', 3, '2025-12-17 07:21:49'),
(21, 'TXN-20251217-450952', 'S-AB-T-SHIRT', 'SMALL AQUA BLUE T-SHIRT', 'T-Shirt', 'S', 'Head Office', 5, '2025-12-17 10:39:40'),
(22, 'TXN-20251217-600491', 'S-AB-T-SHIRT', 'SMALL AQUA BLUE T-SHIRT', 'T-Shirt', 'S', 'Head Office', 5, '2025-12-17 10:41:15'),
(23, 'TXN-20251217-683671', 'S-AB-T-SHIRT', 'SMALL AQUA BLUE T-SHIRT', 'T-Shirt', 'S', 'Head Office', 3, '2025-12-17 10:45:17'),
(24, 'TXN-20251217-408124', 'S-AB-T-SHIRT', 'SMALL AQUA BLUE T-SHIRT', 'T-Shirt', 'S', 'Head Office', 1, '2025-12-17 10:47:38'),
(25, 'TXN-20251217-206830', 'S-AB-T-SHIRT', 'SMALL AQUA BLUE T-SHIRT', 'T-Shirt', 'S', 'Head Office', 3, '2025-12-17 10:53:59'),
(26, 'TXN-20251217-839290', 'S-AB-T-SHIRT', 'SMALL AQUA BLUE T-SHIRT', 'T-Shirt', 'S', 'Head Office', 1, '2025-12-17 10:55:51'),
(27, 'TXN-20251217-876279', 'S-AB-T-SHIRT', 'SMALL AQUA BLUE T-SHIRT', 'T-Shirt', 'S', 'Head Office', 1, '2025-12-17 10:58:13'),
(28, 'TXN-20251217-230668', 'S-AB-T-SHIRT', 'SMALL AQUA BLUE T-SHIRT', 'T-Shirt', 'S', 'Head Office', 21, '2025-12-17 11:00:04'),
(29, 'TXN-20251217-142313', 'S-AB-T-SHIRT', 'SMALL AQUA BLUE T-SHIRT', 'T-Shirt', 'S', 'Head Office', 1, '2025-12-17 11:01:46'),
(30, 'TXN-20251217-534090', 'S-AB-T-SHIRT', 'SMALL AQUA BLUE T-SHIRT', 'T-Shirt', 'S', 'Head Office', 1, '2025-12-17 11:03:09'),
(31, 'TXN-20251217-079294', 'S-AB-T-SHIRT', 'SMALL AQUA BLUE T-SHIRT', 'T-Shirt', 'S', 'Head Office', 1, '2025-12-17 11:04:44'),
(32, 'TXN-20251217-425078', 'S-AB-T-SHIRT', 'SMALL AQUA BLUE T-SHIRT', 'T-Shirt', 'S', 'Head Office', 1, '2025-12-17 11:06:07'),
(33, 'TXN-20251217-140581', 'S-AB-T-SHIRT', 'SMALL AQUA BLUE T-SHIRT', 'T-Shirt', 'S', 'Head Office', 1, '2025-12-17 11:33:05'),
(34, 'TXN-20251217-191062', 'S-AB-T-SHIRT', 'SMALL AQUA BLUE T-SHIRT', 'T-Shirt', 'S', 'Head Office', 1, '2025-12-17 11:33:54'),
(35, 'TXN-20251217-097549', 'S-AB-T-SHIRT', 'SMALL AQUA BLUE T-SHIRT', 'T-Shirt', 'S', 'Head Office', 1, '2025-12-17 11:38:55'),
(36, 'TXN-20251217-193125', 'S-AB-T-SHIRT', 'SMALL AQUA BLUE T-SHIRT', 'T-Shirt', 'S', 'Head Office', 1, '2025-12-17 11:42:30'),
(37, 'TXN-20251217-674210', 'S-AB-T-SHIRT', 'SMALL AQUA BLUE T-SHIRT', 'T-Shirt', 'S', 'Head Office', 1, '2025-12-17 11:43:06'),
(38, 'TXN-20251217-851488', 'S-AB-T-SHIRT', 'SMALL AQUA BLUE T-SHIRT', 'T-Shirt', 'S', 'Head Office', 1, '2025-12-17 11:43:50'),
(39, 'TXN-20251217-099092', 'S-AB-T-SHIRT', 'SMALL AQUA BLUE T-SHIRT', 'T-Shirt', 'S', 'Head Office', 1, '2025-12-17 11:45:22'),
(40, 'TXN-20251217-375002', 'S-AB-T-SHIRT', 'SMALL AQUA BLUE T-SHIRT', 'T-Shirt', 'S', 'Head Office', 1, '2025-12-17 11:46:53'),
(41, 'TXN-20251217-806757', 'S-AB-T-SHIRT', 'SMALL AQUA BLUE T-SHIRT', 'T-Shirt', 'S', 'Head Office', 1, '2025-12-17 11:49:09'),
(42, 'TXN-20251217-760492', 'S-AB-T-SHIRT', 'SMALL AQUA BLUE T-SHIRT', 'T-Shirt', 'S', 'Distribution Center', 1, '2025-12-17 11:49:32'),
(43, 'TXN-20251217-668847', 'S-AB-T-SHIRT', 'SMALL AQUA BLUE T-SHIRT', 'T-Shirt', 'S', 'Head Office', 1, '2025-12-17 12:01:06'),
(44, 'TXN-20251217-231161', 'S-AB-T-SHIRT', 'SMALL AQUA BLUE T-SHIRT', 'T-Shirt', 'S', 'Head Office', 1, '2025-12-17 13:41:51'),
(45, 'TXN-20251217-580976', 'S-AB-T-SHIRT', 'SMALL AQUA BLUE T-SHIRT', 'T-Shirt', 'S', 'Head Office', 1, '2025-12-17 14:07:56'),
(47, 'TXN-20251217-486713', 'S-AB-T-SHIRT', 'SMALL AQUA BLUE T-SHIRT', 'T-Shirt', 'S', 'Head Office', 1, '2025-12-17 14:08:30'),
(48, 'TXN-20251217-182631', 'S-AB-T-SHIRT', 'SMALL AQUA BLUE T-SHIRT', 'T-Shirt', 'S', 'Head Office', 3, '2025-12-17 14:58:04'),
(49, 'TXN-20251217-360325', 'S-AB-T-SHIRT', 'SMALL AQUA BLUE T-SHIRT', 'T-Shirt', 'S', 'Head Office', 9, '2025-12-17 15:09:38'),
(50, 'TXN-20251217-227937', 'S-AB-T-SHIRT', 'SMALL AQUA BLUE T-SHIRT', 'T-Shirt', 'S', 'Head Office', 2, '2025-12-17 16:34:53'),
(52, 'TXN-20251222-252323', 'S-AB-T-SHIRT', 'SMALL AQUA BLUE T-SHIRT', 'T-Shirt', 'S', 'Head Office', 1, '2025-12-22 16:58:56'),
(54, 'TXN-20251223-921725', 'S-AB-T-SHIRT', 'SMALL AQUA BLUE T-SHIRT', 'T-Shirt', 'S', 'Head Office', 6, '2025-12-23 08:50:40'),
(58, 'TXN-20251223-555855', 'S-AB-T-SHIRT', 'SMALL AQUA BLUE T-SHIRT', 'T-Shirt', 'S', 'Head Office', 15, '2025-12-23 14:27:00');

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
(2, 'TXN-20251211-015549', 'Prince', 'New Hire', NULL, 4, 'System', NULL, '2025-12-11 11:31:21', '2025-12-11 11:31:21'),
(3, 'TXN-20251211-815741', 'Prince', 'New Hire', NULL, 3, 'System', NULL, '2025-12-11 11:51:48', '2025-12-11 11:51:48'),
(4, 'TXN-20251211-952888', 'Prince', 'New Hire', NULL, 3, 'System', NULL, '2025-12-11 11:53:06', '2025-12-11 11:53:06'),
(5, 'TXN-20251211-682034', 'Prince', 'New Hire', NULL, 4, 'System', NULL, '2025-12-11 11:53:53', '2025-12-11 11:53:53'),
(6, 'TXN-20251211-082269', 'Prince', 'New Hire', NULL, 1, 'System', NULL, '2025-12-11 11:55:57', '2025-12-11 11:55:57'),
(7, 'TXN-20251211-514986', 'aira', 'New Hire', NULL, 1, 'System', NULL, '2025-12-11 11:58:49', '2025-12-11 11:58:49'),
(8, 'TXN-20251211-812129', 'Prince', 'New Hire', NULL, 8, 'System', NULL, '2025-12-11 13:11:50', '2025-12-11 13:11:50'),
(9, 'TXN-20251211-121016', 'Prince', 'New Hire', NULL, 30, 'System', NULL, '2025-12-11 13:17:52', '2025-12-11 13:17:52'),
(10, 'TXN-20251211-005099', 'Prince', 'New Hire', NULL, 2, 'System', NULL, '2025-12-11 13:22:08', '2025-12-11 13:22:08'),
(11, 'TXN-20251211-041961', 'Prince', 'New Hire', NULL, 5, 'System', NULL, '2025-12-11 13:53:45', '2025-12-11 13:53:45'),
(12, 'TXN-20251211-332295', 'Prince', 'New Hire', NULL, 30, 'System', NULL, '2025-12-11 14:01:14', '2025-12-11 14:01:14'),
(13, 'TXN-20251211-953960', 'Prince', 'New Hire', NULL, 400, 'System', NULL, '2025-12-11 14:01:44', '2025-12-11 14:01:44'),
(14, 'TXN-20251211-828834', 'Prince', 'New Hire', NULL, 1, 'System', NULL, '2025-12-11 14:03:55', '2025-12-11 14:03:55'),
(17, 'TXN-20251216-231071', 'AIRA', 'New Hire', NULL, 2, 'System', NULL, '2025-12-16 09:39:15', '2025-12-16 09:39:15'),
(19, 'TXN-20251217-101561', 'Prince', 'New Hire', 'Head Office', 3, 'System', NULL, '2025-12-17 07:21:49', '2025-12-17 07:21:49'),
(20, 'TXN-20251217-450952', 'Prince', 'New Hire', 'Head Office', 5, 'System', NULL, '2025-12-17 10:39:40', '2025-12-17 10:39:40'),
(21, 'TXN-20251217-600491', 'Prince', 'New Hire', 'Head Office', 5, 'System', NULL, '2025-12-17 10:41:15', '2025-12-17 10:41:15'),
(22, 'TXN-20251217-683671', 'Prince', 'New Hire', 'Head Office', 3, 'System', NULL, '2025-12-17 10:45:17', '2025-12-17 10:45:17'),
(23, 'TXN-20251217-408124', 'Prince', 'New Hire', 'Head Office', 1, 'System', NULL, '2025-12-17 10:47:38', '2025-12-17 10:47:38'),
(24, 'TXN-20251217-206830', 'Prince', 'New Hire', 'Head Office', 3, 'System', NULL, '2025-12-17 10:53:59', '2025-12-17 10:53:59'),
(25, 'TXN-20251217-839290', 'Prince', 'New Hire', 'Head Office', 1, 'System', NULL, '2025-12-17 10:55:51', '2025-12-17 10:55:51'),
(26, 'TXN-20251217-876279', 'Prince', 'New Hire', 'Head Office', 1, 'System', NULL, '2025-12-17 10:58:13', '2025-12-17 10:58:13'),
(27, 'TXN-20251217-230668', 'Prince', 'New Hire', 'Head Office', 21, 'System', NULL, '2025-12-17 11:00:04', '2025-12-17 11:00:04'),
(28, 'TXN-20251217-142313', 'Prince', 'New Hire', 'Head Office', 1, 'System', NULL, '2025-12-17 11:01:46', '2025-12-17 11:01:46'),
(29, 'TXN-20251217-534090', 'Prince', 'New Hire', 'Head Office', 1, 'System', NULL, '2025-12-17 11:03:09', '2025-12-17 11:03:09'),
(30, 'TXN-20251217-079294', 'Prince', 'New Hire', 'Head Office', 1, 'System', NULL, '2025-12-17 11:04:44', '2025-12-17 11:04:44'),
(31, 'TXN-20251217-425078', 'Prince', 'New Hire', 'Head Office', 1, 'System', NULL, '2025-12-17 11:06:07', '2025-12-17 11:06:07'),
(32, 'TXN-20251217-140581', 'Prince', 'New Hire', 'Head Office', 1, 'System', NULL, '2025-12-17 11:33:05', '2025-12-17 11:33:05'),
(33, 'TXN-20251217-191062', 'Prince', 'New Hire', 'Head Office', 1, 'System', NULL, '2025-12-17 11:33:54', '2025-12-17 11:33:54'),
(34, 'TXN-20251217-097549', 'Prince', 'New Hire', 'Head Office', 1, 'System', NULL, '2025-12-17 11:38:55', '2025-12-17 11:38:55'),
(35, 'TXN-20251217-193125', 'Prince', 'New Hire', 'Head Office', 1, 'System', NULL, '2025-12-17 11:42:30', '2025-12-17 11:42:30'),
(36, 'TXN-20251217-674210', 'Prince', 'New Hire', 'Head Office', 1, 'System', NULL, '2025-12-17 11:43:06', '2025-12-17 11:43:06'),
(37, 'TXN-20251217-851488', 'Prince', 'New Hire', 'Head Office', 1, 'System', NULL, '2025-12-17 11:43:50', '2025-12-17 11:43:50'),
(38, 'TXN-20251217-099092', 'Prince', 'New Hire', 'Head Office', 1, 'System', NULL, '2025-12-17 11:45:22', '2025-12-17 11:45:22'),
(39, 'TXN-20251217-375002', 'Prince', 'New Hire', 'Head Office', 1, 'System', NULL, '2025-12-17 11:46:53', '2025-12-17 11:46:53'),
(40, 'TXN-20251217-806757', 'Prince', 'New Hire', 'Head Office', 1, 'System', NULL, '2025-12-17 11:49:09', '2025-12-17 11:49:09'),
(41, 'TXN-20251217-760492', 'Prince', 'New Hire', 'Distribution Center', 1, 'System', NULL, '2025-12-17 11:49:32', '2025-12-17 11:49:32'),
(42, 'TXN-20251217-668847', 'Prince', 'New Hire', 'Head Office', 1, 'System', NULL, '2025-12-17 12:01:06', '2025-12-17 12:01:06'),
(43, 'TXN-20251217-231161', 'Prince', 'New Hire', 'Head Office', 1, 'System', NULL, '2025-12-17 13:41:51', '2025-12-17 13:41:51'),
(44, 'TXN-20251217-580976', 'Prince', 'New Hire', 'Head Office', 2, 'System', NULL, '2025-12-17 14:07:56', '2025-12-17 14:07:56'),
(45, 'TXN-20251217-486713', 'Prince', 'New Hire', 'Head Office', 1, 'System', NULL, '2025-12-17 14:08:30', '2025-12-17 14:08:30'),
(46, 'TXN-20251217-182631', 'Prince', 'Additional', 'Head Office', 3, 'System', NULL, '2025-12-17 14:58:04', '2025-12-17 14:58:04'),
(47, 'TXN-20251217-360325', 'Norman Madrid', 'New Hire', 'Head Office', 9, 'System', NULL, '2025-12-17 15:09:38', '2025-12-17 15:09:38'),
(48, 'TXN-20251217-227937', 'Prince', 'New Hire', 'Head Office', 2, 'System', NULL, '2025-12-17 16:34:53', '2025-12-17 16:34:53'),
(50, 'TXN-20251222-252323', 'prince', 'New Hire', 'Head Office', 1, 'Prince Roi Ocdamia', '00-0002', '2025-12-22 16:58:56', '2025-12-22 16:58:56'),
(52, 'TXN-20251223-921725', 'ROI', 'New Hire', 'Head Office', 6, 'Prince Roi Ocdamia', '00-0001', '2025-12-23 08:50:40', '2025-12-23 08:50:40'),
(56, 'TXN-20251223-555855', 'PRINCE ROI', 'New Hire', 'Head Office', 15, 'First Name Last Name', 'username', '2025-12-23 14:27:00', '2025-12-23 14:27:00');

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
(7, 'S-AB-T-SHIRT', 'item_6949e5ec6e7d65.37918853.jpg', 'SMALL AQUA BLUE T-SHIRT', 'T-Shirt', 'S', '', 126, 0, '2025-12-11 01:57:21', '2025-12-23 06:27:00'),
(21, 'Medium-AB-T-SHIRT', 'item_694a214fc0eeb9.04727999.jpg', 'Medium Aqua Blue T-Shirt', 'T-Shirt', 'M', '', 100, 0, '2025-12-23 04:57:16', '2025-12-23 06:34:32');

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
(31, '00-0001', 'Airaleen', 'Montoya', 'airaleen.montoya@stronglinkservices.net', '$2y$10$Wf1qLUyWFof7DfSEvFt.1O.UJaauoSg9qnJaWS6goHQw0BYqQ83/y', 7, 2, 'Active', '2025-12-23 14:41:31', '2025-12-23 06:41:23', '2025-12-23 06:41:31'),
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
(108, 31, 'dashboard', 1, 1, 1, 1, 0, '2025-12-23 06:41:23', '2025-12-23 06:41:23'),
(109, 31, 'deliveries', 1, 1, 1, 1, 0, '2025-12-23 06:41:23', '2025-12-23 06:41:23'),
(110, 31, 'history', 0, 0, 0, 0, 0, '2025-12-23 06:41:23', '2025-12-23 06:41:23'),
(111, 31, 'inventory', 1, 1, 1, 1, 0, '2025-12-23 06:41:23', '2025-12-23 06:41:23'),
(112, 31, 'issuance', 1, 1, 1, 1, 0, '2025-12-23 06:41:23', '2025-12-23 06:41:23'),
(113, 31, 'pos', 1, 1, 1, 1, 0, '2025-12-23 06:41:23', '2025-12-23 06:41:23'),
(114, 31, 'reports', 0, 0, 0, 0, 0, '2025-12-23 06:41:23', '2025-12-23 06:41:23'),
(115, 31, 'settings', 0, 0, 0, 0, 0, '2025-12-23 06:41:23', '2025-12-23 06:41:23'),
(116, 31, 'users', 0, 0, 0, 0, 0, '2025-12-23 06:41:23', '2025-12-23 06:41:23'),
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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `delivery_history`
--
ALTER TABLE `delivery_history`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `departments`
--
ALTER TABLE `departments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `issuance_items`
--
ALTER TABLE `issuance_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=59;

--
-- AUTO_INCREMENT for table `issuance_transactions`
--
ALTER TABLE `issuance_transactions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=57;

--
-- AUTO_INCREMENT for table `items`
--
ALTER TABLE `items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=22;

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
