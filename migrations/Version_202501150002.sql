/************************************************************
# SQL Migrations
# Version 202501150002
#
# Author: System
# Database: fract_db
# Generation Time: 2025-01-15 00:02:00 +0530
# ************************************************************/

-- Remove unique constraint on role column
ALTER TABLE `user_roles` DROP INDEX `role`;

-- Add Name column after role column
ALTER TABLE `user_roles` ADD COLUMN `name` varchar(100) NOT NULL AFTER `role`;

-- Update existing records to set name based on role (for backward compatibility)
UPDATE `user_roles` SET `name` = `role` WHERE `name` IS NULL OR `name` = '';

-- #REVERT STATEMENTS
-- ALTER TABLE `user_roles` DROP COLUMN `name`;
-- ALTER TABLE `user_roles` ADD UNIQUE KEY `uk_role_name` (`role`);
