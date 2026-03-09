CREATE TABLE `ai_generated_content` (
	`id` int AUTO_INCREMENT NOT NULL,
	`event_id` int NOT NULL,
	`content_type` varchar(64) NOT NULL,
	`title` varchar(255) NOT NULL,
	`content` text NOT NULL,
	`edited_content` text,
	`status` varchar(32) NOT NULL DEFAULT 'generated',
	`recipients` text,
	`generated_at` timestamp NOT NULL DEFAULT (now()),
	`generated_by` int,
	`approved_at` timestamp,
	`approved_by` int,
	`rejected_at` timestamp,
	`rejection_reason` text,
	`sent_at` timestamp,
	`sent_to` text,
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ai_generated_content_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `compliance_audit_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`event_id` varchar(128),
	`action` enum('flagged','reviewed','approved','disclosed','certificate_generated','exported') NOT NULL,
	`user_id` int,
	`details` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `compliance_audit_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `compliance_flags` (
	`id` int AUTO_INCREMENT NOT NULL,
	`event_id` varchar(128) NOT NULL,
	`statement_text` text NOT NULL,
	`timestamp` varchar(16),
	`speaker_name` varchar(255),
	`risk_level` enum('low','medium','high') NOT NULL DEFAULT 'low',
	`flag_reason` text,
	`compliance_status` enum('flagged','reviewed','approved','disclosed') NOT NULL DEFAULT 'flagged',
	`reviewed_by` int,
	`reviewed_at` timestamp,
	`approved_by` int,
	`approved_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `compliance_flags_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `followup_emails` (
	`id` int AUTO_INCREMENT NOT NULL,
	`followup_id` int NOT NULL,
	`email_body` text,
	`recipient_email` varchar(320),
	`sent_at` timestamp,
	`opened_at` timestamp,
	`clicked_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `followup_emails_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `investor_followups` (
	`id` int AUTO_INCREMENT NOT NULL,
	`event_id` varchar(128) NOT NULL,
	`investor_name` varchar(255),
	`investor_email` varchar(320),
	`investor_company` varchar(255),
	`question_text` text,
	`commitment_text` text,
	`follow_up_status` enum('pending','contacted','resolved','dismissed') NOT NULL DEFAULT 'pending',
	`crm_contact_id` varchar(128),
	`crm_activity_id` varchar(128),
	`email_template` text,
	`email_sent_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `investor_followups_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sentiment_snapshots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`event_id` varchar(128) NOT NULL,
	`snapshot_at` timestamp NOT NULL DEFAULT (now()),
	`overall_score` int NOT NULL DEFAULT 50,
	`bullish_count` int NOT NULL DEFAULT 0,
	`neutral_count` int NOT NULL DEFAULT 0,
	`bearish_count` int NOT NULL DEFAULT 0,
	`top_sentiment_drivers` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sentiment_snapshots_id` PRIMARY KEY(`id`)
);
