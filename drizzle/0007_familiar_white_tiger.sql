ALTER TABLE `live_roadshow_meetings` ADD `slideDeckUrl` varchar(1024);--> statement-breakpoint
ALTER TABLE `live_roadshow_meetings` ADD `slideDeckName` varchar(255);--> statement-breakpoint
ALTER TABLE `live_roadshow_meetings` ADD `currentSlideIndex` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `live_roadshow_meetings` ADD `totalSlides` int DEFAULT 0 NOT NULL;