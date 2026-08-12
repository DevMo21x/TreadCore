CREATE INDEX `idx_preset_segments_preset_id` ON `preset_segments` (`preset_id`);--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_presets` (
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
	FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "presets_visibility_author_consistency" CHECK(("__new_presets"."visibility" = 'public' AND "__new_presets"."author_id" IS NULL) OR ("__new_presets"."visibility" = 'private' AND "__new_presets"."author_id" IS NOT NULL))
);
--> statement-breakpoint
INSERT INTO `__new_presets`("id", "name", "description", "author_id", "visibility", "tags", "difficulty", "total_duration_seconds", "created_at", "updated_at") SELECT "id", "name", "description", "author_id", "visibility", "tags", "difficulty", "total_duration_seconds", "created_at", "updated_at" FROM `presets`;--> statement-breakpoint
DROP TABLE `presets`;--> statement-breakpoint
ALTER TABLE `__new_presets` RENAME TO `presets`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `idx_presets_author_id` ON `presets` (`author_id`);--> statement-breakpoint
CREATE INDEX `idx_presets_visibility` ON `presets` (`visibility`);--> statement-breakpoint
CREATE INDEX `idx_presets_visibility_created` ON `presets` (`visibility`,`created_at`);