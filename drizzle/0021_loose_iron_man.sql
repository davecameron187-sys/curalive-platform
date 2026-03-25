ALTER TABLE `webphone_sessions` ADD `is_voicemail` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `webphone_sessions` ADD `voicemail_url` varchar(512);--> statement-breakpoint
ALTER TABLE `webphone_sessions` ADD `voicemail_duration` int;--> statement-breakpoint
ALTER TABLE `webphone_sessions` ADD `transcription` text;--> statement-breakpoint
ALTER TABLE `webphone_sessions` ADD `transcription_language` varchar(16);--> statement-breakpoint
ALTER TABLE `webphone_sessions` ADD `transcription_status` enum('pending','processing','completed','failed');--> statement-breakpoint
ALTER TABLE `webphone_sessions` ADD `transferred_to` varchar(128);--> statement-breakpoint
ALTER TABLE `webphone_sessions` ADD `transfer_type` enum('blind','warm');