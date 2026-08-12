DROP TABLE `posts`;--> statement-breakpoint
ALTER TABLE `workout_metrics` ADD `elapsed_seconds` integer NOT NULL;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_workouts` (
	`workout_id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`start_time` text DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')) NOT NULL,
	`end_time` text,
	`total_distance_km` real DEFAULT 0 NOT NULL,
	`avg_speed_kmh` real DEFAULT 0 NOT NULL,
	`total_calories` integer DEFAULT 0 NOT NULL,
	`total_elevation_gain` real DEFAULT 0 NOT NULL,
	`xp_earned` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "workouts_total_distance_km_nonnegative" CHECK("__new_workouts"."total_distance_km" >= 0),
	CONSTRAINT "workouts_avg_speed_kmh_nonnegative" CHECK("__new_workouts"."avg_speed_kmh" >= 0),
	CONSTRAINT "workouts_total_calories_nonnegative" CHECK("__new_workouts"."total_calories" >= 0),
	CONSTRAINT "workouts_total_elevation_gain_nonnegative" CHECK("__new_workouts"."total_elevation_gain" >= 0),
	CONSTRAINT "workouts_end_time_after_start_time" CHECK("__new_workouts"."end_time" is null or "__new_workouts"."end_time" >= "__new_workouts"."start_time"),
	CONSTRAINT "workouts_xp_earned_nonnegative" CHECK("__new_workouts"."xp_earned" >= 0)
);
--> statement-breakpoint
INSERT INTO `__new_workouts`("workout_id", "user_id", "start_time", "end_time", "total_distance_km", "avg_speed_kmh", "total_calories", "total_elevation_gain", "xp_earned") SELECT "workout_id", "user_id", "start_time", "end_time", "total_distance_km", "avg_speed_kmh", "total_calories", "total_elevation_gain", 0 FROM `workouts`;--> statement-breakpoint
DROP TABLE `workouts`;--> statement-breakpoint
ALTER TABLE `__new_workouts` RENAME TO `workouts`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `idx_workouts_user_id` ON `workouts` (`user_id`);