CREATE TABLE `video_categories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`thumbnail_path` text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `video_categories_name_unique` ON `video_categories` (`name`);--> statement-breakpoint
CREATE TABLE `videos` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`filename` text NOT NULL,
	`title` text NOT NULL,
	`category_id` integer NOT NULL,
	`thumbnail_path` text DEFAULT '' NOT NULL,
	`video_path` text NOT NULL,
	`is_visible` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT (date('now')) NOT NULL,
	FOREIGN KEY (`category_id`) REFERENCES `video_categories`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE INDEX `idx_videos_category_id` ON `videos` (`category_id`);