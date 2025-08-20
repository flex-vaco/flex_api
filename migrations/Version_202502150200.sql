/************************************************************
# SQL Migrations
# Version 202502150200
#
# Author: System
# Database: fract_db
# Generation Time: 2025-02-15 02:00:00 +0530
# ************************************************************/

CREATE TABLE `work_request` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `service_line_id` int(10) unsigned NOT NULL,
  `project_id` int(10) unsigned NOT NULL,
  `duration_from` date NOT NULL,
  `duration_to` date NOT NULL,
  `hours_per_week` int(3) NOT NULL,
  `notes` text NULL,
  `project_attachment` varchar(500) NULL,
  `status` enum('draft', 'submitted', 'approved', 'rejected', 'in_progress', 'completed') DEFAULT 'draft',
  `submitted_by` int(10) unsigned NOT NULL,
  `submitted_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`service_line_id`) REFERENCES `service_line`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`project_id`) REFERENCES `project_details`(`project_id`) ON DELETE CASCADE,
  FOREIGN KEY (`submitted_by`) REFERENCES `users`(`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8;

CREATE TABLE `work_request_capability_areas` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `work_request_id` int(10) unsigned NOT NULL,
  `capability_area_id` int(10) unsigned NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_work_request_capability` (`work_request_id`, `capability_area_id`),
  FOREIGN KEY (`work_request_id`) REFERENCES `work_request`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`capability_area_id`) REFERENCES `capability_area`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8;

CREATE TABLE `work_request_resources` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `work_request_id` int(10) unsigned NOT NULL,
  `employee_id` int(10) unsigned NOT NULL,
  `allocation_percentage` int(3) DEFAULT 100,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_work_request_employee` (`work_request_id`, `employee_id`),
  FOREIGN KEY (`work_request_id`) REFERENCES `work_request`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`employee_id`) REFERENCES `employee_details`(`emp_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8;

-- #REVERT STATEMENTS
-- DROP TABLE IF EXISTS `work_request_resources`;
-- DROP TABLE IF EXISTS `work_request_capability_areas`;
-- DROP TABLE IF EXISTS `work_request`; 