ALTER TABLE `occ_chat_messages` ADD `detectedLanguage` varchar(10);--> statement-breakpoint
ALTER TABLE `occ_chat_messages` ADD `translatedMessage` text;--> statement-breakpoint
ALTER TABLE `occ_chat_messages` ADD `translationLanguage` varchar(10);