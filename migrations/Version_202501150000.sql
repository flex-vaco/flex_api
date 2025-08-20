/************************************************************
# SQL Migrations
# Version 202501150000
#
# Author: System
# Database: fract_db
# Generation Time: 2025-01-15 00:00:00 +0530
# ************************************************************/

-- Add line_of_business_id column to service_line table
ALTER TABLE `service_line` 
ADD COLUMN `line_of_business_id` int(10) unsigned NOT NULL DEFAULT 1 AFTER `description`;

-- Add foreign key constraint
ALTER TABLE `service_line` 
ADD CONSTRAINT `fk_service_line_line_of_business` 
FOREIGN KEY (`line_of_business_id`) REFERENCES `line_of_business`(`id`) ON DELETE CASCADE;

-- Update existing service lines to have a default line of business (assuming ID 1 exists)
-- UPDATE `service_line` SET `line_of_business_id` = 0 WHERE `line_of_business_id` = 1 OR `line_of_business_id` IS NULL;

-- Make the column NOT NULL after setting default values
ALTER TABLE `service_line` 
MODIFY COLUMN `line_of_business_id` int(10) unsigned NOT NULL;

-- #REVERT STATEMENTS
-- ALTER TABLE `service_line` DROP FOREIGN KEY `fk_service_line_line_of_business`;
-- ALTER TABLE `service_line` DROP COLUMN `line_of_business_id`;
