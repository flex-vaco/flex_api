ALTER TABLE `employee_project_allocations` CHANGE `rate_per_hour` `bill_rate_per_hour` FLOAT(7,2) NOT NULL DEFAULT '0.00';
ALTER TABLE `employee_details` CHANGE `rate_per_hour` `cost_per_hour` FLOAT(7,2) NOT NULL;
ALTER TABLE `employee_details` ADD `line_of_business_id` INT NOT NULL DEFAULT '1' AFTER `functional_focus_area`;