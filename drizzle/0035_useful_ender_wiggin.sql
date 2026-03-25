CREATE TABLE `occ_recall_bots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`conference_id` int NOT NULL,
	`bot_id` varchar(255) NOT NULL,
	`platform` enum('zoom','teams','webex','rtmp','pstn') NOT NULL,
	`status` enum('active','stopped','failed') NOT NULL DEFAULT 'active',
	`recording_url` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`stopped_at` timestamp,
	CONSTRAINT `occ_recall_bots_id` PRIMARY KEY(`id`),
	CONSTRAINT `occ_recall_bots_bot_id_unique` UNIQUE(`bot_id`)
);
--> statement-breakpoint
CREATE TABLE `occ_transcript_audit_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`conference_id` int NOT NULL,
	`action` enum('transcription_started','transcription_completed','segment_added','segment_edited','segment_deleted','transcript_finalized','transcript_exported') NOT NULL,
	`user_id` int,
	`details` json,
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `occ_transcript_audit_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `occ_transcript_edits` (
	`id` int AUTO_INCREMENT NOT NULL,
	`transcription_segment_id` bigint NOT NULL,
	`conference_id` int NOT NULL,
	`operator_id` int NOT NULL,
	`original_text` text NOT NULL,
	`corrected_text` text NOT NULL,
	`edit_type` enum('correction','deletion','merge','split') NOT NULL DEFAULT 'correction',
	`reason` varchar(255),
	`approved` boolean NOT NULL DEFAULT false,
	`approved_by` int,
	`approved_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `occ_transcript_edits_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `occ_transcription_segments` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`conference_id` int NOT NULL,
	`participant_id` int,
	`speaker_name` varchar(255) NOT NULL,
	`speaker_role` enum('moderator','participant','operator') NOT NULL DEFAULT 'participant',
	`text` text NOT NULL,
	`start_time` int NOT NULL,
	`end_time` int NOT NULL,
	`confidence` int NOT NULL DEFAULT 95,
	`language` varchar(10) NOT NULL DEFAULT 'en',
	`is_final` boolean NOT NULL DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `occ_transcription_segments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `occ_transcriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`conference_id` int NOT NULL,
	`full_transcript` longtext,
	`summary` text,
	`key_points` json,
	`action_items` json,
	`speakers` json,
	`duration` int NOT NULL,
	`language` varchar(10) NOT NULL DEFAULT 'en',
	`word_count` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `occ_transcriptions_id` PRIMARY KEY(`id`),
	CONSTRAINT `occ_transcriptions_conference_id_unique` UNIQUE(`conference_id`)
);
