/************************************************************
# SQL Migrations
# Version 202501150001
#
# Author: System
# Database: fract_db
# Generation Time: 2025-01-15 00:01:00 +0530
# ************************************************************/

-- Add line_of_business_id column to capability_area table
ALTER TABLE `capability_area` 
ADD COLUMN `line_of_business_id` int(10) unsigned NOT NULL DEFAULT 1 AFTER `description`;

-- Add foreign key constraint
ALTER TABLE `capability_area` 
ADD CONSTRAINT `fk_capability_area_line_of_business` 
FOREIGN KEY (`line_of_business_id`) REFERENCES `line_of_business`(`id`) ON DELETE CASCADE;

-- Update existing capability areas to have a default line of business (assuming ID 1 exists)
-- UPDATE `capability_area` SET `line_of_business_id` = 0 WHERE `line_of_business_id` = 0 OR `line_of_business_id` IS NULL;

-- Make the column NOT NULL after setting default values
ALTER TABLE `capability_area` 
MODIFY COLUMN `line_of_business_id` int(10) unsigned NOT NULL;

-- #REVERT STATEMENTS
-- ALTER TABLE `capability_area` DROP FOREIGN KEY `fk_capability_area_line_of_business`;
-- ALTER TABLE `capability_area` DROP COLUMN `line_of_business_id`;
