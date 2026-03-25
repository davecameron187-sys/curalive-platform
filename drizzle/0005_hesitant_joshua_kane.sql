CREATE TABLE `occ_dial_out_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`conferenceId` int NOT NULL,
	`operatorId` int,
	`operatorName` varchar(255),
	`dialEntries` text NOT NULL,
	`successCount` int NOT NULL DEFAULT 0,
	`failCount` int NOT NULL DEFAULT 0,
	`totalCount` int NOT NULL DEFAULT 0,
	`initiatedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `occ_dial_out_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `occ_green_rooms` (
	`id` int AUTO_INCREMENT NOT NULL,
	`conferenceId` int NOT NULL,
	`name` varchar(255) NOT NULL DEFAULT 'Speaker Green Room',
	`dialInNumber` varchar(32),
	`accessCode` varchar(32),
	`isActive` boolean NOT NULL DEFAULT false,
	`isOpen` boolean NOT NULL DEFAULT false,
	`transferredAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `occ_green_rooms_id` PRIMARY KEY(`id`),
	CONSTRAINT `occ_green_rooms_conferenceId_unique` UNIQUE(`conferenceId`)
);
