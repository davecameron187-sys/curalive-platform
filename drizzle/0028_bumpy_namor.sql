CREATE TABLE `billing_activity_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`quote_id` int,
	`invoice_id` int,
	`client_id` int NOT NULL,
	`event_type` varchar(64) NOT NULL,
	`description` text NOT NULL,
	`metadata` text,
	`actor_user_id` int,
	`actor_type` varchar(16) NOT NULL DEFAULT 'system',
	`ip_address` varchar(64),
	`user_agent` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `billing_activity_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `billing_email_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tracking_token` varchar(64) NOT NULL,
	`quote_id` int,
	`invoice_id` int,
	`credit_note_id` int,
	`client_id` int NOT NULL,
	`recipient_email` varchar(320) NOT NULL,
	`email_type` varchar(32) NOT NULL,
	`subject` varchar(512),
	`sent_at` timestamp NOT NULL DEFAULT (now()),
	`first_opened_at` timestamp,
	`open_count` int NOT NULL DEFAULT 0,
	`last_opened_at` timestamp,
	`last_open_ip` varchar(64),
	`last_open_user_agent` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `billing_email_events_id` PRIMARY KEY(`id`),
	CONSTRAINT `billing_email_events_tracking_token_unique` UNIQUE(`tracking_token`)
);
--> statement-breakpoint
CREATE TABLE `billing_line_item_templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`category` varchar(128) NOT NULL,
	`default_unit_price_cents` bigint NOT NULL,
	`default_currency` varchar(8) NOT NULL DEFAULT 'ZAR',
	`is_package` boolean NOT NULL DEFAULT false,
	`package_items_json` text,
	`usage_count` int NOT NULL DEFAULT 0,
	`is_active` boolean NOT NULL DEFAULT true,
	`created_by_user_id` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `billing_line_item_templates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `billing_recurring_templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`client_id` int NOT NULL,
	`title_template` varchar(512) NOT NULL,
	`line_items_json` text NOT NULL,
	`discount_percent` int NOT NULL DEFAULT 0,
	`tax_percent` int NOT NULL DEFAULT 15,
	`currency` varchar(8) NOT NULL DEFAULT 'ZAR',
	`payment_terms` text,
	`frequency` enum('monthly','quarterly','annually') NOT NULL,
	`day_of_month` int NOT NULL DEFAULT 1,
	`next_generation_at` timestamp NOT NULL,
	`last_generated_at` timestamp,
	`is_active` boolean NOT NULL DEFAULT true,
	`auto_draft` boolean NOT NULL DEFAULT true,
	`created_by_user_id` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `billing_recurring_templates_id` PRIMARY KEY(`id`)
);
