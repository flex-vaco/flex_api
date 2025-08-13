/************************************************************
# SQL Migrations
# Version 202502150000
#
# Author: System
# Database: fract_db
# Generation Time: 2025-02-15 00:00:00 +0530
# ************************************************************/

CREATE TABLE `line_of_business` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_line_of_business_name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8;

-- #REVERT STATEMENTS
-- #DROP TABLE IF EXISTS `line_of_business`; 