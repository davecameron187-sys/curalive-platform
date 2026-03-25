CREATE TABLE `webphone_carrier_status` (
	`id` int AUTO_INCREMENT NOT NULL,
	`carrier` enum('twilio','telnyx') NOT NULL,
	`status` enum('healthy','degraded','down') NOT NULL DEFAULT 'healthy',
	`failover_active` boolean NOT NULL DEFAULT false,
	`last_checked_at` bigint,
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `webphone_carrier_status_id` PRIMARY KEY(`id`),
	CONSTRAINT `webphone_carrier_status_carrier_unique` UNIQUE(`carrier`)
);
--> statement-breakpoint
CREATE TABLE `webphone_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`conference_id` int,
	`carrier` enum('twilio','telnyx') NOT NULL DEFAULT 'twilio',
	`status` enum('initiated','ringing','in_progress','completed','failed','no_answer') NOT NULL DEFAULT 'initiated',
	`direction` enum('outbound','inbound') NOT NULL DEFAULT 'outbound',
	`remote_number` varchar(32),
	`call_sid` varchar(128),
	`duration_secs` int,
	`started_at` bigint NOT NULL,
	`ended_at` bigint,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `webphone_sessions_id` PRIMARY KEY(`id`)
);
