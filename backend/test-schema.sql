-- Test Database Schema for BookMyNurse
-- This file contains the same schema as production but without sensitive data

/*!40101 SET NAMES utf8 */;
/*!40101 SET SQL_MODE=''*/;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

-- Table structure for table `bookings`
DROP TABLE IF EXISTS `bookings`;
CREATE TABLE `bookings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `mobile` varchar(15) NOT NULL,
  `nurseType` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `location` varchar(255) NOT NULL,
  `services` varchar(255) NOT NULL,
  `preferences` varchar(50) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `enquiryno` varchar(50) NOT NULL,
  `nurse_id` int DEFAULT NULL,
  `approval_status` enum('Ongoing','Complete') DEFAULT 'Ongoing',
  PRIMARY KEY (`id`),
  KEY `fk_nurse` (`nurse_id`),
  CONSTRAINT `fk_nurse` FOREIGN KEY (`nurse_id`) REFERENCES `registration` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Table structure for table `clientusers`
DROP TABLE IF EXISTS `clientusers`;
CREATE TABLE `clientusers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `phone_number` varchar(15) NOT NULL,
  `password` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Table structure for table `images`
DROP TABLE IF EXISTS `images`;
CREATE TABLE `images` (
  `id` int NOT NULL AUTO_INCREMENT,
  `file_path` varchar(255) NOT NULL,
  `uploaded_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Table structure for table `registration`
DROP TABLE IF EXISTS `registration`;
CREATE TABLE `registration` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL DEFAULT '',
  `aadhaar` varchar(12) DEFAULT NULL,
  `mobile` varchar(10) NOT NULL,
  `email` varchar(255) NOT NULL,
  `gender` enum('male','female') NOT NULL,
  `dob` date NOT NULL,
  `education` varchar(255) NOT NULL,
  `experience` int NOT NULL,
  `languages` json DEFAULT NULL,
  `specialization` varchar(255) NOT NULL,
  `address` text NOT NULL,
  `base_location` varchar(255) NOT NULL,
  `image_id` int NOT NULL,
  `approval_status` enum('Pending','Approved','Rejected') DEFAULT 'Pending',
  `serviceopt` json DEFAULT NULL,
  `availability` enum('Available','Unavailable','Pending') DEFAULT 'Pending',
  `charges` decimal(10,2) DEFAULT '0.00',
  `charges_type` enum('per_day','per_week','per_month') DEFAULT 'per_day',
  PRIMARY KEY (`id`),
  UNIQUE KEY `aadhaar` (`aadhaar`),
  KEY `image_id` (`image_id`),
  CONSTRAINT `registration_ibfk_1` FOREIGN KEY (`image_id`) REFERENCES `images` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Table structure for table `users`
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('admin','user') NOT NULL DEFAULT 'user',
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Insert test data
INSERT INTO `images` (`id`, `file_path`, `uploaded_at`) VALUES 
(1, 'test-image.jpg', NOW());

INSERT INTO `users` (`id`, `username`, `password`, `role`) VALUES 
(1, 'testadmin', '$2a$10$test.hash.for.testing', 'admin'),
(2, 'testuser', '$2a$10$test.hash.for.testing', 'user');

INSERT INTO `clientusers` (`id`, `email`, `phone_number`, `password`, `created_at`) VALUES 
(1, 'test@example.com', '9876543210', '$2a$10$test.hash.for.testing', NOW());

INSERT INTO `registration` (`id`, `name`, `mobile`, `email`, `gender`, `dob`, `education`, `experience`, `specialization`, `address`, `base_location`, `image_id`, `approval_status`, `availability`) VALUES 
(1, 'Test Nurse', '9876543210', 'testnurse@example.com', 'female', '1990-01-01', 'B.Sc Nursing', 5, 'General Care', 'Test Address', 'Test City', 1, 'Approved', 'Available');

INSERT INTO `bookings` (`id`, `name`, `mobile`, `nurseType`, `location`, `services`, `preferences`, `enquiryno`, `nurse_id`, `approval_status`) VALUES 
(1, 'Test Client', '9876543211', 'Female', 'Test Location', 'General Care', '12hrs', 'TEST-001', 1, 'Ongoing');

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;
