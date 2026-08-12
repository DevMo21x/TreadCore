CREATE TABLE `preset_segments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`preset_id` integer NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	`name` text,
	`duration_seconds` integer NOT NULL,
	`speed` real NOT NULL,
	`incline` real NOT NULL,
	FOREIGN KEY (`preset_id`) REFERENCES `presets`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `presets` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`author_id` integer,
	`visibility` text DEFAULT 'public' NOT NULL,
	`tags` text,
	`difficulty` text DEFAULT 'moderate' NOT NULL,
	`total_duration_seconds` integer,
	`created_at` text DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')),
	`updated_at` text DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')),
	FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_presets_author_id` ON `presets` (`author_id`);