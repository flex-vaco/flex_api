/************************************************************
# SQL Migrations
# Version 202501160000
#
# Author: System
# Database: fract_db
# Generation Time: 2025-01-16 00:00:00 +0530
# ************************************************************/

-- Add line_of_business_id column to work_request table
ALTER TABLE `work_request` 
ADD COLUMN `line_of_business_id` int(10) unsigned NOT NULL DEFAULT 1 AFTER `service_line_id`;

-- Add foreign key constraint
ALTER TABLE `work_request` 
ADD CONSTRAINT `fk_work_request_line_of_business` 
FOREIGN KEY (`line_of_business_id`) REFERENCES `line_of_business`(`id`) ON DELETE CASCADE;

-- Make the column NOT NULL after setting default values
ALTER TABLE `work_request` 
MODIFY COLUMN `line_of_business_id` int(10) unsigned NOT NULL;

-- #REVERT STATEMENTS
-- ALTER TABLE `work_request` DROP FOREIGN KEY `fk_work_request_line_of_business`;
-- ALTER TABLE `work_request` DROP COLUMN `line_of_business_id`;
