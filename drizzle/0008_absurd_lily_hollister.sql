CREATE TABLE `live_meeting_summaries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`meetingDbId` int NOT NULL,
	`roadshowId` varchar(128) NOT NULL,
	`summary` text NOT NULL,
	`keyTopics` text,
	`actionItems` text,
	`sentiment` enum('positive','neutral','negative') DEFAULT 'neutral',
	`generatedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `live_meeting_summaries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `slide_thumbnails` (
	`id` int AUTO_INCREMENT NOT NULL,
	`meetingDbId` int NOT NULL,
	`slideIndex` int NOT NULL,
	`thumbnailUrl` varchar(1024) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `slide_thumbnails_id` PRIMARY KEY(`id`)
);
