-- ========================================
-- Bus Seat Booking System - Database Schema
-- ========================================
-- Auto-creates database and tables if not exists
-- MySQL 8.0+ Compatible
-- ========================================

-- Create database if not exists
CREATE DATABASE IF NOT EXISTS `bookingbussystem` 
DEFAULT CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE `bookingbussystem`;

-- ========================================
-- Table: Users
-- Stores user authentication and profile information
-- ========================================
CREATE TABLE IF NOT EXISTS `Users` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `email` VARCHAR(255) NOT NULL UNIQUE,
    `password_hash` VARCHAR(255) NOT NULL,
    `full_name` VARCHAR(100) NOT NULL,
    `phone` VARCHAR(20) DEFAULT NULL,
    `role` ENUM('user', 'admin') DEFAULT 'user',
    `is_active` BOOLEAN DEFAULT TRUE,
    `email_verified` BOOLEAN DEFAULT FALSE,
    `last_login` TIMESTAMP NULL DEFAULT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_email` (`email`),
    INDEX `idx_role` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- Table: Routes
-- Stores bus route information
-- ========================================
CREATE TABLE IF NOT EXISTS `Routes` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `origin` VARCHAR(100) NOT NULL,
    `destination` VARCHAR(100) NOT NULL,
    `duration` VARCHAR(50) NOT NULL COMMENT 'e.g., "3h 30m"',
    `distance_km` DECIMAL(6,2) DEFAULT NULL,
    `base_price` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_origin_dest` (`origin`, `destination`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- Table: Buses
-- Stores bus information
-- ========================================
CREATE TABLE IF NOT EXISTS `Buses` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `bus_number` VARCHAR(50) NOT NULL UNIQUE,
    `total_seats` INT NOT NULL DEFAULT 40,
    `layout_type` VARCHAR(20) NOT NULL DEFAULT '2x2' COMMENT 'Seat layout: 2x2, 2x3, etc.',
    `bus_type` ENUM('AC', 'Non-AC', 'Luxury', 'Semi-Luxury') DEFAULT 'Non-AC',
    `is_active` BOOLEAN DEFAULT TRUE,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_bus_number` (`bus_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- Table: Schedules
-- Links routes and buses with specific dates/times
-- ========================================
CREATE TABLE IF NOT EXISTS `Schedules` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `route_id` INT NOT NULL,
    `bus_id` INT NOT NULL,
    `travel_date` DATE NOT NULL,
    `departure_time` TIME NOT NULL,
    `arrival_time` TIME DEFAULT NULL,
    `available_seats` INT NOT NULL,
    `status` ENUM('Scheduled', 'In-Transit', 'Completed', 'Cancelled') DEFAULT 'Scheduled',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`route_id`) REFERENCES `Routes`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`bus_id`) REFERENCES `Buses`(`id`) ON DELETE CASCADE,
    INDEX `idx_travel_date` (`travel_date`),
    INDEX `idx_route_date` (`route_id`, `travel_date`),
    UNIQUE KEY `unique_schedule` (`bus_id`, `travel_date`, `departure_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- Table: Bookings
-- Stores passenger booking information
-- ========================================
CREATE TABLE IF NOT EXISTS `Bookings` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `schedule_id` INT NOT NULL,
    `user_id` INT DEFAULT NULL COMMENT 'NULL for guest bookings',
    `seat_number` VARCHAR(10) NOT NULL COMMENT 'e.g., A1, B5, C10',
    `passenger_name` VARCHAR(100) NOT NULL,
    `passenger_phone` VARCHAR(20) NOT NULL,
    `passenger_email` VARCHAR(100) DEFAULT NULL,
    `booking_uuid` VARCHAR(36) NOT NULL UNIQUE COMMENT 'Unique booking reference',
    `booking_status` ENUM('Confirmed', 'Cancelled', 'Completed') DEFAULT 'Confirmed',
    `amount_paid` DECIMAL(10,2) DEFAULT 0.00,
    `payment_status` ENUM('Pending', 'Paid', 'Refunded') DEFAULT 'Paid',
    `payment_method` ENUM('Cash', 'Card', 'Online', 'Pending') DEFAULT 'Pending',
    `cancelled_at` TIMESTAMP NULL DEFAULT NULL,
    `cancellation_reason` TEXT DEFAULT NULL,
    `booked_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`schedule_id`) REFERENCES `Schedules`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`user_id`) REFERENCES `Users`(`id`) ON DELETE SET NULL,
    INDEX `idx_booking_uuid` (`booking_uuid`),
    INDEX `idx_schedule_seat` (`schedule_id`, `seat_number`),
    INDEX `idx_passenger_phone` (`passenger_phone`),
    INDEX `idx_user_id` (`user_id`),
    UNIQUE KEY `unique_booking` (`schedule_id`, `seat_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- Insert Sample Data
-- ========================================

-- Insert Default Admin User (password: admin123)
-- Password hash generated using bcrypt for 'admin123'
INSERT INTO `Users` (`email`, `password_hash`, `full_name`, `phone`, `role`, `email_verified`) VALUES
('admin@busbooking.com', '$2a$10$wYIFXCKAlSnO8dLhOc6cduW/3wD2gZk61I9KG8puDWzDDPLRiLDKS', 'System Administrator', '+94771111111', 'admin', TRUE),
('user@example.com', '$2a$10$wYIFXCKAlSnO8dLhOc6cduW/3wD2gZk61I9KG8puDWzDDPLRiLDKS', 'John Doe', '+94772222222', 'user', TRUE)
ON DUPLICATE KEY UPDATE `email` = VALUES(`email`);

-- Insert Routes
INSERT INTO `Routes` (`origin`, `destination`, `duration`, `distance_km`, `base_price`) VALUES
('Colombo', 'Kandy', '3h 30m', 115.00, 450.00),
('Galle', 'Matara', '1h 15m', 45.00, 180.00),
('Colombo', 'Jaffna', '7h 45m', 395.00, 1200.00),
('Kandy', 'Nuwara Eliya', '2h 30m', 77.00, 350.00),
('Colombo', 'Galle', '2h 15m', 119.00, 400.00)
ON DUPLICATE KEY UPDATE `origin` = VALUES(`origin`);

-- Insert Buses
INSERT INTO `Buses` (`bus_number`, `total_seats`, `layout_type`, `bus_type`) VALUES
('NB-001', 40, '2x2', 'AC'),
('NB-002', 40, '2x2', 'Non-AC'),
('NB-003', 50, '2x3', 'Luxury'),
('NB-004', 36, '2x2', 'Semi-Luxury'),
('NB-005', 40, '2x2', 'AC')
ON DUPLICATE KEY UPDATE `bus_number` = VALUES(`bus_number`);

-- Insert Schedules (Next 7 days)
INSERT INTO `Schedules` (`route_id`, `bus_id`, `travel_date`, `departure_time`, `arrival_time`, `available_seats`) VALUES
-- Colombo to Kandy (Route 1)
(1, 1, CURDATE(), '06:00:00', '09:30:00', 40),
(1, 2, CURDATE(), '10:00:00', '13:30:00', 40),
(1, 1, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '06:00:00', '09:30:00', 40),
(1, 2, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '14:00:00', '17:30:00', 40),

-- Galle to Matara (Route 2)
(2, 3, CURDATE(), '08:00:00', '09:15:00', 50),
(2, 4, CURDATE(), '16:00:00', '17:15:00', 36),
(2, 3, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '08:00:00', '09:15:00', 50),

-- Colombo to Jaffna (Route 3)
(3, 5, CURDATE(), '20:00:00', '03:45:00', 40),
(3, 5, DATE_ADD(CURDATE(), INTERVAL 2 DAY), '20:00:00', '03:45:00', 40),

-- Kandy to Nuwara Eliya (Route 4)
(4, 2, CURDATE(), '07:30:00', '10:00:00', 40),
(4, 4, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '13:00:00', '15:30:00', 36)
ON DUPLICATE KEY UPDATE `available_seats` = VALUES(`available_seats`);

-- Insert Sample Bookings (for demonstration)
INSERT INTO `Bookings` (`schedule_id`, `seat_number`, `passenger_name`, `passenger_phone`, `passenger_email`, `booking_uuid`, `amount_paid`) VALUES
(1, 'A1', 'John Perera', '+94771234567', 'john@example.com', UUID(), 450.00),
(1, 'A2', 'Mary Silva', '+94772345678', 'mary@example.com', UUID(), 450.00),
(1, 'B1', 'Kasun Fernando', '+94773456789', 'kasun@example.com', UUID(), 450.00),
(2, 'C5', 'Nimal Rajapaksa', '+94774567890', 'nimal@example.com', UUID(), 450.00),
(5, 'A10', 'Sunil Wickramasinghe', '+94775678901', 'sunil@example.com', UUID(), 180.00)
ON DUPLICATE KEY UPDATE `passenger_name` = VALUES(`passenger_name`);

-- Update available seats count based on bookings
UPDATE `Schedules` s
SET s.available_seats = (
    SELECT (b.total_seats - IFNULL(COUNT(bk.id), 0))
    FROM `Buses` b
    LEFT JOIN `Bookings` bk ON bk.schedule_id = s.id AND bk.booking_status = 'Confirmed'
    WHERE b.id = s.bus_id
    GROUP BY b.id
);

-- ========================================
-- Success Message
-- ========================================
SELECT 'Database schema created successfully!' AS Status,
       (SELECT COUNT(*) FROM `Routes`) AS Total_Routes,
       (SELECT COUNT(*) FROM `Buses`) AS Total_Buses,
       (SELECT COUNT(*) FROM `Schedules`) AS Total_Schedules,
       (SELECT COUNT(*) FROM `Bookings`) AS Total_Bookings;
