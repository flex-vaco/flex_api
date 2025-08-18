/************************************************************
# SQL Migrations
# Version 202502150100
#
# Author: System
# Database: fract_db
# Generation Time: 2025-02-15 01:00:00 +0530
# ************************************************************/

CREATE TABLE `service_line` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `description` text NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_service_line_name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8;

CREATE TABLE `capability_area` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `description` text NULL,
  `service_line_id` int(10) unsigned NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_capability_area_name` (`name`),
  FOREIGN KEY (`service_line_id`) REFERENCES `service_line`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8;

-- #REVERT STATEMENTS
-- DROP TABLE IF EXISTS `capability_area`;
-- DROP TABLE IF EXISTS `service_line`; 