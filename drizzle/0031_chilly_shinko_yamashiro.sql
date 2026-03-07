CREATE TABLE `operator_preferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`visible_columns` text NOT NULL,
	`visible_metrics` text NOT NULL,
	`compact_mode` boolean NOT NULL DEFAULT false,
	`show_advanced_features` boolean NOT NULL DEFAULT false,
	`sidebar_collapsed` boolean NOT NULL DEFAULT false,
	`enable_keyboard_shortcuts` boolean NOT NULL DEFAULT true,
	`enable_auto_refresh` boolean NOT NULL DEFAULT true,
	`auto_refresh_interval` int NOT NULL DEFAULT 5,
	`enable_sound_alerts` boolean NOT NULL DEFAULT true,
	`enable_desktop_notifications` boolean NOT NULL DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `operator_preferences_id` PRIMARY KEY(`id`),
	CONSTRAINT `operator_preferences_user_id_unique` UNIQUE(`user_id`)
);
