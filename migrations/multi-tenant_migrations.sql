-- Below statements are added for converting to multi-tenant with Line_Of_Business as the base table for each tenant

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

ALTER TABLE `service_line` 
ADD COLUMN `line_of_business_id` int(10) unsigned NOT NULL DEFAULT 1 AFTER `description`;

ALTER TABLE `service_line` 
ADD CONSTRAINT `fk_service_line_line_of_business` 
FOREIGN KEY (`line_of_business_id`) REFERENCES `line_of_business`(`id`) ON DELETE CASCADE;

--UPDATE `service_line` SET `line_of_business_id` = 0 WHERE `line_of_business_id` = 1 OR `line_of_business_id` IS NULL;

ALTER TABLE `service_line` 
MODIFY COLUMN `line_of_business_id` int(10) unsigned NOT NULL;


ALTER TABLE `capability_area` 
ADD COLUMN `line_of_business_id` int(10) unsigned NOT NULL DEFAULT 1 AFTER `description`;

ALTER TABLE `capability_area` 
ADD CONSTRAINT `fk_capability_area_line_of_business` 
FOREIGN KEY (`line_of_business_id`) REFERENCES `line_of_business`(`id`) ON DELETE CASCADE;

--UPDATE `capability_area` SET `line_of_business_id` = 1 WHERE `line_of_business_id` = 0 OR `line_of_business_id` IS NULL;


ALTER TABLE `capability_area` 
MODIFY COLUMN `line_of_business_id` int(10) unsigned NOT NULL;


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


ALTER TABLE `user_roles` DROP INDEX `role`;

-- Add Name column after role column
ALTER TABLE `user_roles` ADD COLUMN `name` varchar(100) NOT NULL AFTER `role`;

-- Update existing records to set name based on role (for backward compatibility)
UPDATE `user_roles` SET `name` = `role` WHERE `name` IS NULL OR `name` = '';

ALTER TABLE `user_roles` ADD COLUMN `line_of_business_id` int(10) unsigned NOT NULL DEFAULT 1 AFTER `role_description`;

-- Add foreign key constraint (will fail gracefully if it already exists)
ALTER TABLE `user_roles` ADD CONSTRAINT `fk_user_roles_line_of_business` 
FOREIGN KEY (`line_of_business_id`) REFERENCES `line_of_business`(`id`) ON DELETE CASCADE;


ALTER TABLE `work_request` 
ADD COLUMN `line_of_business_id` int(10) unsigned NOT NULL DEFAULT 1 AFTER `service_line_id`;

-- Add foreign key constraint
ALTER TABLE `work_request` 
ADD CONSTRAINT `fk_work_request_line_of_business` 
FOREIGN KEY (`line_of_business_id`) REFERENCES `line_of_business`(`id`) ON DELETE CASCADE;

-- Make the column NOT NULL after setting default values
ALTER TABLE `work_request` 
MODIFY COLUMN `line_of_business_id` int(10) unsigned NOT NULL;

ALTER TABLE `employee_details` DROP `line_of_business_id`;

ALTER TABLE `users` ADD `line_of_business_id` int(10) unsigned NOT NULL DEFAULT 1 AFTER `role`;
 
ALTER TABLE `project_details` ADD `line_of_business_id` int(10) unsigned NOT NULL DEFAULT 1 AFTER `client_id`;
 
ALTER TABLE `employee_details` ADD `line_of_business_id` int(10) unsigned NOT NULL DEFAULT 1 AFTER `functional_focus_area`;
 
ALTER TABLE `users`
ADD CONSTRAINT `fk_users_line_of_business`
FOREIGN KEY (`line_of_business_id`) REFERENCES `line_of_business` (`id`)
ON DELETE RESTRICT ON UPDATE CASCADE;
 
ALTER TABLE `project_details`
ADD CONSTRAINT `fk_project_details_line_of_business`
FOREIGN KEY (`line_of_business_id`) REFERENCES `line_of_business` (`id`)
ON DELETE RESTRICT ON UPDATE CASCADE;
 
ALTER TABLE `employee_details`
ADD CONSTRAINT `fk_employee_details_line_of_business`
FOREIGN KEY (`line_of_business_id`) REFERENCES `line_of_business` (`id`)
ON DELETE RESTRICT ON UPDATE CASCADE;
 
CREATE INDEX `idx_users_line_of_business_id` ON `users` (`line_of_business_id`);
CREATE INDEX `idx_project_details_line_of_business_id` ON `project_details` (`line_of_business_id`);
CREATE INDEX `idx_employee_details_line_of_business_id` ON `employee_details` (`line_of_business_id`);

