ALTER TABLE `exercise_attempts` ADD `run_number` integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `lesson_progress` ADD `completions` integer DEFAULT 0 NOT NULL;