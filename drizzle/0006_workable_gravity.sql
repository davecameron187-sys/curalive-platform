CREATE TABLE `live_roadshow_investors` (
	`id` int AUTO_INCREMENT NOT NULL,
	`roadshowId` varchar(128) NOT NULL,
	`meetingId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`institution` varchar(255) NOT NULL,
	`email` varchar(320),
	`phone` varchar(32),
	`jobTitle` varchar(255),
	`waitingRoomStatus` enum('not_arrived','in_waiting_room','admitted','completed','no_show') NOT NULL DEFAULT 'not_arrived',
	`arrivedAt` timestamp,
	`admittedAt` timestamp,
	`inviteSentAt` timestamp,
	`inviteToken` varchar(128),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `live_roadshow_investors_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `live_roadshow_meetings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`roadshowId` varchar(128) NOT NULL,
	`meetingDate` varchar(32) NOT NULL,
	`startTime` varchar(8) NOT NULL,
	`endTime` varchar(8) NOT NULL,
	`timezone` varchar(64) NOT NULL DEFAULT 'Europe/London',
	`meetingType` enum('1x1','group','large_group') NOT NULL DEFAULT '1x1',
	`platform` enum('zoom','teams','webex','mixed') NOT NULL DEFAULT 'zoom',
	`videoLink` varchar(512),
	`meetingId` varchar(128),
	`passcode` varchar(64),
	`status` enum('scheduled','waiting_room_open','in_progress','completed','cancelled') NOT NULL DEFAULT 'scheduled',
	`operatorNotes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `live_roadshow_meetings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `live_roadshows` (
	`id` int AUTO_INCREMENT NOT NULL,
	`roadshowId` varchar(128) NOT NULL,
	`title` varchar(255) NOT NULL,
	`issuer` varchar(255) NOT NULL,
	`bank` varchar(255),
	`serviceType` enum('capital_raising_1x1','research_presentation','earnings_call','hybrid_conference') NOT NULL DEFAULT 'capital_raising_1x1',
	`platform` enum('zoom','teams','webex','mixed') NOT NULL DEFAULT 'zoom',
	`status` enum('draft','active','completed','cancelled') NOT NULL DEFAULT 'draft',
	`startDate` varchar(32),
	`endDate` varchar(32),
	`timezone` varchar(64) NOT NULL DEFAULT 'Europe/London',
	`brandingEnabled` boolean NOT NULL DEFAULT true,
	`customLogoUrl` varchar(512),
	`notes` text,
	`createdByUserId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `live_roadshows_id` PRIMARY KEY(`id`),
	CONSTRAINT `live_roadshows_roadshowId_unique` UNIQUE(`roadshowId`)
);
