CREATE TABLE `achievement_definitions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`code` text NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`image_url` text NOT NULL,
	`category` text NOT NULL,
	`active` integer DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `achievement_definitions_code_unique` ON `achievement_definitions` (`code`);--> statement-breakpoint
CREATE TABLE `achievement_rules` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`achievement_id` integer NOT NULL,
	`scope` text NOT NULL,
	`metric` text NOT NULL,
	`aggregation` text NOT NULL,
	`comparison` text NOT NULL,
	`target_value` real NOT NULL,
	`target_min` real,
	`target_max` real,
	`window_days` integer,
	FOREIGN KEY (`achievement_id`) REFERENCES `achievement_definitions`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `achievement_rules_achievement_id_metric_unique` ON `achievement_rules` (`achievement_id`,`metric`);--> statement-breakpoint
CREATE TABLE `user_achievement_progress` (
	`user_id` integer NOT NULL,
	`achievement_id` integer NOT NULL,
	`progress_value` real NOT NULL,
	`updated_at` integer DEFAULT  (unixepoch()),
	PRIMARY KEY(`achievement_id`, `user_id`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`achievement_id`) REFERENCES `achievement_definitions`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `user_achievements` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`achievement_id` integer NOT NULL,
	`earned_at` integer DEFAULT (unixepoch()),
	`source_workout_id` integer,
	`metadata_json` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`achievement_id`) REFERENCES `achievement_definitions`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_achievements_achievement_id_user_id_unique` ON `user_achievements` (`achievement_id`,`user_id`);