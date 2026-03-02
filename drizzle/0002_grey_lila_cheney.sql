CREATE TABLE `occ_access_code_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`conferenceId` int NOT NULL,
	`callingNumber` varchar(32),
	`calledNumber` varchar(32),
	`accessCodeEntered` varchar(64),
	`isValid` boolean NOT NULL,
	`attemptedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `occ_access_code_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `occ_audio_files` (
	`id` int AUTO_INCREMENT NOT NULL,
	`conferenceId` int,
	`name` varchar(255) NOT NULL,
	`fileUrl` varchar(512) NOT NULL,
	`fileKey` varchar(512) NOT NULL,
	`durationSeconds` int,
	`isPlaying` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `occ_audio_files_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `occ_chat_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`conferenceId` int NOT NULL,
	`senderType` enum('operator','participant','moderator','system') NOT NULL,
	`senderName` varchar(255) NOT NULL,
	`senderId` int,
	`recipientType` enum('all','hosts','participant') NOT NULL DEFAULT 'all',
	`recipientId` int,
	`message` text NOT NULL,
	`sentAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `occ_chat_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `occ_conferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventId` varchar(128) NOT NULL,
	`callId` varchar(64) NOT NULL,
	`subject` varchar(255) NOT NULL,
	`reseller` varchar(128) NOT NULL DEFAULT 'Chorus Call Inc.',
	`product` varchar(128) NOT NULL DEFAULT 'Event Conference',
	`moderatorCode` varchar(32),
	`participantCode` varchar(32),
	`securityCode` varchar(32),
	`dialInNumber` varchar(32),
	`webAccessCode` varchar(32),
	`status` enum('pending','running','completed','alarm') NOT NULL DEFAULT 'pending',
	`isLocked` boolean NOT NULL DEFAULT false,
	`isRecording` boolean NOT NULL DEFAULT false,
	`waitingMusicEnabled` boolean NOT NULL DEFAULT true,
	`participantLimitEnabled` boolean NOT NULL DEFAULT false,
	`participantLimit` int DEFAULT 500,
	`requestsToSpeakEnabled` boolean NOT NULL DEFAULT true,
	`scheduledStart` timestamp,
	`actualStart` timestamp,
	`endedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `occ_conferences_id` PRIMARY KEY(`id`),
	CONSTRAINT `occ_conferences_callId_unique` UNIQUE(`callId`)
);
--> statement-breakpoint
CREATE TABLE `occ_lounge` (
	`id` int AUTO_INCREMENT NOT NULL,
	`conferenceId` int NOT NULL,
	`callId` varchar(64) NOT NULL,
	`phoneNumber` varchar(32),
	`name` varchar(255),
	`company` varchar(255),
	`dialInNumber` varchar(32),
	`description` varchar(255),
	`language` varchar(32) DEFAULT 'en',
	`arrivedAt` timestamp NOT NULL DEFAULT (now()),
	`pickedAt` timestamp,
	`pickedByOperatorId` int,
	`status` enum('waiting','picked','admitted','dropped') NOT NULL DEFAULT 'waiting',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `occ_lounge_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `occ_operator_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`conferenceId` int NOT NULL,
	`participantId` int NOT NULL,
	`callId` varchar(64) NOT NULL,
	`subject` varchar(255),
	`phoneNumber` varchar(32),
	`dialInNumber` varchar(32),
	`requestedAt` timestamp NOT NULL DEFAULT (now()),
	`pickedAt` timestamp,
	`pickedByOperatorId` int,
	`status` enum('pending','picked','resolved') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `occ_operator_requests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `occ_operator_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`operatorName` varchar(255) NOT NULL,
	`state` enum('absent','present','in_call','break') NOT NULL DEFAULT 'absent',
	`activeConferenceId` int,
	`openConferenceIds` text,
	`lastHeartbeat` timestamp NOT NULL DEFAULT (now()),
	`loginAt` timestamp,
	`breakAt` timestamp,
	`logoutAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `occ_operator_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `occ_participant_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`conferenceId` int NOT NULL,
	`participantId` int NOT NULL,
	`event` enum('free','incoming','connected','muted','unmuted','parked','unparked','speaking','speaking_ended','disconnected','picked','request_to_speak','request_accepted','request_refused','moved_to_subconference','returned_from_subconference') NOT NULL,
	`triggeredBy` enum('system','operator','participant','moderator') NOT NULL DEFAULT 'system',
	`operatorId` int,
	`note` varchar(255),
	`occurredAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `occ_participant_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `occ_participants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`conferenceId` int NOT NULL,
	`lineNumber` int NOT NULL,
	`role` enum('moderator','participant','operator','host') NOT NULL DEFAULT 'participant',
	`name` varchar(255),
	`company` varchar(255),
	`location` varchar(128),
	`phoneNumber` varchar(32),
	`dialInNumber` varchar(32),
	`voiceServer` varchar(32),
	`state` enum('free','incoming','connected','muted','parked','speaking','waiting_operator','web_participant','dropped') NOT NULL DEFAULT 'incoming',
	`isSpeaking` boolean NOT NULL DEFAULT false,
	`isWebParticipant` boolean NOT NULL DEFAULT false,
	`requestToSpeak` boolean NOT NULL DEFAULT false,
	`requestToSpeakPosition` int,
	`subconferenceId` int,
	`isMonitored` boolean NOT NULL DEFAULT false,
	`monitoringOperatorId` int,
	`connectedAt` timestamp,
	`disconnectedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `occ_participants_id` PRIMARY KEY(`id`)
);
