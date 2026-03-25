CREATE TABLE `training_call_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`training_session_id` int NOT NULL,
	`training_conference_id` int NOT NULL,
	`operator_id` int NOT NULL,
	`participant_name` varchar(255) NOT NULL,
	`call_duration` int NOT NULL DEFAULT 0,
	`call_quality` enum('poor','fair','good','excellent') NOT NULL DEFAULT 'good',
	`operator_performance` text,
	`participant_feedback` text,
	`recording_url` varchar(1024),
	`started_at` timestamp NOT NULL DEFAULT (now()),
	`ended_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `training_call_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `training_conferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`training_session_id` int NOT NULL,
	`event_id` varchar(128) NOT NULL,
	`call_id` varchar(128) NOT NULL,
	`subject` varchar(512) NOT NULL,
	`product` varchar(128),
	`status` enum('pending','active','completed') NOT NULL DEFAULT 'pending',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `training_conferences_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `training_lounge` (
	`id` int AUTO_INCREMENT NOT NULL,
	`training_session_id` int NOT NULL,
	`participant_name` varchar(255) NOT NULL,
	`waiting_since` timestamp NOT NULL DEFAULT (now()),
	`status` enum('waiting','admitted','left') NOT NULL DEFAULT 'waiting',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `training_lounge_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `training_mode_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`operator_id` int NOT NULL,
	`operator_name` varchar(255) NOT NULL,
	`session_name` varchar(255) NOT NULL,
	`scenario` varchar(64) NOT NULL,
	`mentor_id` int,
	`status` enum('active','completed','paused') NOT NULL DEFAULT 'active',
	`started_at` timestamp NOT NULL DEFAULT (now()),
	`completed_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `training_mode_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `training_participants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`training_conference_id` int NOT NULL,
	`line_number` int NOT NULL,
	`role` varchar(64),
	`name` varchar(255) NOT NULL,
	`company` varchar(255),
	`phone_number` varchar(32),
	`state` enum('incoming','connected','disconnected') NOT NULL DEFAULT 'incoming',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `training_participants_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `training_performance_metrics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`training_session_id` int NOT NULL,
	`operator_id` int NOT NULL,
	`total_calls_handled` int NOT NULL DEFAULT 0,
	`average_call_duration` int NOT NULL DEFAULT 0,
	`call_quality_score` varchar(8) NOT NULL DEFAULT '0',
	`average_participant_satisfaction` varchar(8) NOT NULL DEFAULT '0',
	`communication_score` varchar(8) NOT NULL DEFAULT '0',
	`problem_solving_score` varchar(8) NOT NULL DEFAULT '0',
	`professionalism` varchar(8) NOT NULL DEFAULT '0',
	`overall_score` varchar(8) NOT NULL DEFAULT '0',
	`ready_for_production` boolean NOT NULL DEFAULT false,
	`mentor_notes` text,
	`evaluated_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `training_performance_metrics_id` PRIMARY KEY(`id`)
);
