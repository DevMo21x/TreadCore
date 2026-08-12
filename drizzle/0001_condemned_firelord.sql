CREATE TABLE `workout_metrics` (
	`metric_id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`workout_id` integer NOT NULL,
	`recorded_at` text DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')) NOT NULL,
	`speed_kmh` real,
	`incline_pct` real,
	`distance_m` integer,
	FOREIGN KEY (`workout_id`) REFERENCES `workouts`(`workout_id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "workout_metrics_speed_kmh_nonnegative" CHECK("workout_metrics"."speed_kmh" is null or "workout_metrics"."speed_kmh" >= 0),
	CONSTRAINT "workout_metrics_distance_m_nonnegative" CHECK("workout_metrics"."distance_m" is null or "workout_metrics"."distance_m" >= 0)
);
--> statement-breakpoint
CREATE INDEX `idx_metrics_workout_recorded_at` ON `workout_metrics` (`workout_id`,`recorded_at`);--> statement-breakpoint
CREATE TABLE `workouts` (
	`workout_id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`start_time` text DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')) NOT NULL,
	`end_time` text,
	`total_distance_km` real DEFAULT 0 NOT NULL,
	`avg_speed_kmh` real DEFAULT 0 NOT NULL,
	`total_calories` integer DEFAULT 0 NOT NULL,
	`total_elevation_gain` real DEFAULT 0 NOT NULL,
	CONSTRAINT "workouts_total_distance_km_nonnegative" CHECK("workouts"."total_distance_km" >= 0),
	CONSTRAINT "workouts_avg_speed_kmh_nonnegative" CHECK("workouts"."avg_speed_kmh" >= 0),
	CONSTRAINT "workouts_total_calories_nonnegative" CHECK("workouts"."total_calories" >= 0),
	CONSTRAINT "workouts_total_elevation_gain_nonnegative" CHECK("workouts"."total_elevation_gain" >= 0),
	CONSTRAINT "workouts_end_time_after_start_time" CHECK("workouts"."end_time" is null or "workouts"."end_time" >= "workouts"."start_time")
);
