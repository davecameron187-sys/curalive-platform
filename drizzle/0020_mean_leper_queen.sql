ALTER TABLE `webphone_sessions` ADD `recording_sid` varchar(128);--> statement-breakpoint
ALTER TABLE `webphone_sessions` ADD `recording_url` varchar(512);--> statement-breakpoint
ALTER TABLE `webphone_sessions` ADD `recording_status` enum('pending','completed','failed');