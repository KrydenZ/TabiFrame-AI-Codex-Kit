CREATE TABLE `projects` (
	`user_id` text NOT NULL,
	`project_id` text NOT NULL,
	`project_json` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	PRIMARY KEY(`user_id`, `project_id`)
);
--> statement-breakpoint
CREATE INDEX `projects_user_updated_idx` ON `projects` (`user_id`,`updated_at`);--> statement-breakpoint
CREATE TABLE `shot_progress` (
	`user_id` text NOT NULL,
	`project_id` text NOT NULL,
	`shot_id` text NOT NULL,
	`completed_at` text NOT NULL,
	`updated_at` text NOT NULL,
	PRIMARY KEY(`user_id`, `project_id`, `shot_id`)
);
--> statement-breakpoint
CREATE INDEX `shot_progress_user_project_idx` ON `shot_progress` (`user_id`,`project_id`);