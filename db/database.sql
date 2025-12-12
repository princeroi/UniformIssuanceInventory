-- database.sql - Run this to set up your database

-- Use existing database
USE UniformIssuanceInventory;

-- Create roles table
CREATE TABLE IF NOT EXISTS roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create departments table
CREATE TABLE IF NOT EXISTS departments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    department_name VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create users table with user_id instead of username
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(10) NOT NULL UNIQUE,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role_id INT,
    department_id INT,
    status ENUM('Active', 'Inactive') DEFAULT 'Active',
    last_login DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE SET NULL,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
);

-- Insert sample roles
INSERT INTO roles (role_name) VALUES 
('Administrator'),
('Manager'),
('Employee'),
('Supervisor'),
('Guest');

-- Insert sample departments
INSERT INTO departments (department_name) VALUES 
('IT Department'),
('Human Resources'),
('Sales & Marketing'),
('Finance'),
('Operations'),
('Customer Service');

-- Optional: Insert a sample user for testing
-- User ID: 123456, Password will be auto-generated
-- INSERT INTO users (user_id, first_name, last_name, email, password, role_id, department_id, status) 
-- VALUES ('123456', 'John', 'Doe', 'john.doe@example.com', '$2y$10$example_hash', 1, 1, 'Active');