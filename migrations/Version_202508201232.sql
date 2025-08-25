/************************************************************
# SQL Migrations
# Version 202508201232
#
# Author: System
# Database: fract_db
# Generation Time: 2025-08-20 12:32:00 +0530
# ************************************************************/

-- Create user_roles table if it doesn't exist
CREATE TABLE IF NOT EXISTS `user_roles` (
  `role_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `role` varchar(50) NOT NULL,
  `role_description` varchar(255) NOT NULL,
  `line_of_business_id` int(10) unsigned NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`role_id`),
  UNIQUE KEY `uk_role_name` (`role`),
  KEY `fk_user_roles_line_of_business` (`line_of_business_id`),
  CONSTRAINT `fk_user_roles_line_of_business` FOREIGN KEY (`line_of_business_id`) REFERENCES `line_of_business` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8;

-- Add line_of_business_id column to existing table (if table exists but column doesn't)
-- This will fail gracefully if the column already exists
ALTER TABLE `user_roles` ADD COLUMN `line_of_business_id` int(10) unsigned NOT NULL DEFAULT 1 AFTER `role_description`;

-- Add foreign key constraint (will fail gracefully if it already exists)
ALTER TABLE `user_roles` ADD CONSTRAINT `fk_user_roles_line_of_business` 
FOREIGN KEY (`line_of_business_id`) REFERENCES `line_of_business`(`id`) ON DELETE CASCADE;

-- #REVERT STATEMENTS
-- ALTER TABLE `user_roles` DROP FOREIGN KEY `fk_user_roles_line_of_business`;
-- ALTER TABLE `user_roles` DROP COLUMN `line_of_business_id`;
-- DROP TABLE IF EXISTS `user_roles`;
