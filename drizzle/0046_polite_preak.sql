CREATE TABLE `training_call_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`trainingSessionId` int NOT NULL,
	`trainingConferenceId` int NOT NULL,
	`operatorId` int NOT NULL,
	`participantName` varchar(255),
	`callDuration` int NOT NULL,
	`callQuality` varchar(32),
	`operatorPerformance` text,
	`participantFeedback` text,
	`recordingUrl` text,
	`startedAt` timestamp NOT NULL,
	`endedAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `training_call_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `training_conferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`trainingSessionId` int NOT NULL,
	`eventId` varchar(128) NOT NULL,
	`callId` varchar(64) NOT NULL,
	`subject` varchar(255) NOT NULL,
	`product` varchar(128) NOT NULL DEFAULT 'Training Conference',
	`status` enum('pending','running','completed','alarm') NOT NULL DEFAULT 'pending',
	`isLocked` boolean NOT NULL DEFAULT false,
	`isRecording` boolean NOT NULL DEFAULT false,
	`participantCount` int NOT NULL DEFAULT 0,
	`scheduledStart` timestamp,
	`actualStart` timestamp,
	`endedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `training_conferences_id` PRIMARY KEY(`id`),
	CONSTRAINT `training_conferences_callId_unique` UNIQUE(`callId`)
);
--> statement-breakpoint
CREATE TABLE `training_lounge` (
	`id` int AUTO_INCREMENT NOT NULL,
	`trainingConferenceId` int NOT NULL,
	`callId` varchar(64) NOT NULL,
	`phoneNumber` varchar(32),
	`name` varchar(255),
	`company` varchar(255),
	`status` enum('waiting','picked','admitted','dropped') NOT NULL DEFAULT 'waiting',
	`arrivedAt` timestamp NOT NULL DEFAULT (now()),
	`pickedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `training_lounge_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `training_mode_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`operatorName` varchar(255) NOT NULL,
	`sessionName` varchar(255) NOT NULL,
	`status` enum('active','paused','completed') NOT NULL DEFAULT 'active',
	`trainingScenario` varchar(128),
	`mentorId` int,
	`callsHandled` int NOT NULL DEFAULT 0,
	`totalDuration` int NOT NULL DEFAULT 0,
	`averageCallDuration` int NOT NULL DEFAULT 0,
	`participantsSatisfaction` decimal(3,2),
	`startedAt` timestamp NOT NULL DEFAULT (now()),
	`pausedAt` timestamp,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `training_mode_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `training_participants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`trainingConferenceId` int NOT NULL,
	`lineNumber` int NOT NULL,
	`role` enum('moderator','participant','operator','host') NOT NULL DEFAULT 'participant',
	`name` varchar(255),
	`company` varchar(255),
	`phoneNumber` varchar(32),
	`state` enum('free','incoming','connected','muted','parked','speaking','waiting_operator','web_participant','dropped') NOT NULL DEFAULT 'incoming',
	`isSpeaking` boolean NOT NULL DEFAULT false,
	`requestToSpeak` boolean NOT NULL DEFAULT false,
	`connectedAt` timestamp,
	`disconnectedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `training_participants_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `training_performance_metrics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`trainingSessionId` int NOT NULL,
	`operatorId` int NOT NULL,
	`totalCallsHandled` int NOT NULL DEFAULT 0,
	`averageCallDuration` int NOT NULL DEFAULT 0,
	`callQualityScore` decimal(3,2) DEFAULT '0.00',
	`averageParticipantSatisfaction` decimal(3,2) DEFAULT '0.00',
	`communicationScore` decimal(3,2) DEFAULT '0.00',
	`problemSolvingScore` decimal(3,2) DEFAULT '0.00',
	`professionalism` decimal(3,2) DEFAULT '0.00',
	`overallScore` decimal(3,2) DEFAULT '0.00',
	`readyForProduction` boolean NOT NULL DEFAULT false,
	`mentorNotes` text,
	`evaluatedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `training_performance_metrics_id` PRIMARY KEY(`id`)
);
