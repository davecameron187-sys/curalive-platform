ALTER TABLE `occ_conferences` MODIFY COLUMN `reseller` varchar(128) NOT NULL DEFAULT 'CuraLive Inc.';--> statement-breakpoint
ALTER TABLE `event_branding` ADD `show_curalive_watermark` boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE `event_branding` DROP COLUMN `show_chorus_watermark`;