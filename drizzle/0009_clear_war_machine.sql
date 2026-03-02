CREATE TABLE `commitment_signals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`meetingDbId` int NOT NULL,
	`roadshowId` varchar(128) NOT NULL,
	`investorId` int,
	`investorName` varchar(255),
	`institution` varchar(255),
	`quote` text NOT NULL,
	`signalType` enum('soft_commit','interest','objection','question','pricing_discussion','size_discussion') NOT NULL,
	`confidenceScore` int NOT NULL DEFAULT 0,
	`indicatedAmount` varchar(64),
	`detectedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `commitment_signals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `investor_briefing_packs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`investorId` int NOT NULL,
	`meetingDbId` int NOT NULL,
	`roadshowId` varchar(128) NOT NULL,
	`investorProfile` text,
	`recentActivity` text,
	`suggestedTalkingPoints` text,
	`knownConcerns` text,
	`previousInteractions` text,
	`generatedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `investor_briefing_packs_id` PRIMARY KEY(`id`)
);
