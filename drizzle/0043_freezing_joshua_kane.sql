CREATE TABLE `transcript_edit_audit_log` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`conference_id` int NOT NULL,
	`edit_id` bigint,
	`version_id` bigint,
	`action` enum('created','edited','approved','rejected','published','reverted','deleted') NOT NULL,
	`user_id` int NOT NULL,
	`user_name` varchar(255) NOT NULL,
	`user_role` enum('operator','admin','moderator') NOT NULL,
	`details` text,
	`ip_address` varchar(45),
	`user_agent` varchar(500),
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `transcript_edit_audit_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `transcript_edits` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`transcription_segment_id` bigint NOT NULL,
	`conference_id` int NOT NULL,
	`original_text` text NOT NULL,
	`corrected_text` text NOT NULL,
	`edit_type` enum('correction','clarification','redaction','speaker_correction') NOT NULL,
	`reason` varchar(500),
	`operator_id` int NOT NULL,
	`operator_name` varchar(255) NOT NULL,
	`approved` boolean NOT NULL DEFAULT false,
	`approved_by` int,
	`approved_at` timestamp,
	`confidence` int NOT NULL DEFAULT 95,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `transcript_edits_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `transcript_versions` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`conference_id` int NOT NULL,
	`version_number` int NOT NULL,
	`full_transcript` longtext NOT NULL,
	`edit_count` int NOT NULL,
	`created_by` int NOT NULL,
	`created_by_name` varchar(255) NOT NULL,
	`change_description` varchar(500),
	`is_published` boolean NOT NULL DEFAULT false,
	`published_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `transcript_versions_id` PRIMARY KEY(`id`)
);
