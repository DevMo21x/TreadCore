ALTER TABLE `workouts` ADD `user_id` integer NOT NULL REFERENCES users(id);--> statement-breakpoint
CREATE INDEX `idx_workouts_user_id` ON `workouts` (`user_id`);