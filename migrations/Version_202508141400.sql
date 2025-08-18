ALTER TABLE employee_details DROP highspring_division;
ALTER TABLE `line_of_business` ADD `contact_person` VARCHAR(100) NULL AFTER `name`, ADD `contact_email` VARCHAR(100) NULL AFTER `contact_person`, ADD `location` VARCHAR(100) NULL AFTER `contact_email`;
ALTER TABLE `project_details` ADD `line_of_business_id` INT NOT NULL DEFAULT '1' AFTER `project_id`;
ALTER TABLE `users` ADD `line_of_business_id` INT NOT NULL DEFAULT '1' AFTER `user_id`;