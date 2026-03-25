CREATE TABLE `direct_access_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`conference_id` int,
	`registration_id` int,
	`entered_pin` varchar(8) NOT NULL,
	`caller_number` varchar(32),
	`outcome` enum('admitted','operator_queue','no_conference','failed') NOT NULL DEFAULT 'failed',
	`call_sid` varchar(128),
	`dial_in_number` varchar(32),
	`attempted_at` bigint NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `direct_access_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `attendee_registrations` ADD `access_pin` varchar(8);--> statement-breakpoint
ALTER TABLE `attendee_registrations` ADD `pin_used_at` timestamp;--> statement-breakpoint
ALTER TABLE `occ_conferences` ADD `autoAdmitEnabled` boolean DEFAULT false NOT NULL;