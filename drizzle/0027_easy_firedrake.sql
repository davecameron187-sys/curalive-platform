CREATE TABLE `billing_client_contacts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`client_id` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(320) NOT NULL,
	`phone` varchar(64),
	`job_title` varchar(255),
	`department` varchar(128),
	`is_primary` boolean NOT NULL DEFAULT false,
	`receives_quotes` boolean NOT NULL DEFAULT true,
	`receives_invoices` boolean NOT NULL DEFAULT true,
	`notes` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `billing_client_contacts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `billing_credit_notes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`credit_note_number` varchar(32) NOT NULL,
	`invoice_id` int NOT NULL,
	`client_id` int NOT NULL,
	`amount_cents` bigint NOT NULL,
	`tax_percent` int NOT NULL DEFAULT 15,
	`tax_cents` bigint NOT NULL DEFAULT 0,
	`total_cents` bigint NOT NULL,
	`currency` varchar(8) NOT NULL DEFAULT 'ZAR',
	`reason` text NOT NULL,
	`status` enum('draft','issued','applied','cancelled') NOT NULL DEFAULT 'draft',
	`access_token` varchar(64),
	`issued_at` timestamp,
	`applied_at` timestamp,
	`internal_notes` text,
	`created_by_user_id` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `billing_credit_notes_id` PRIMARY KEY(`id`),
	CONSTRAINT `billing_credit_notes_credit_note_number_unique` UNIQUE(`credit_note_number`),
	CONSTRAINT `billing_credit_notes_access_token_unique` UNIQUE(`access_token`)
);
--> statement-breakpoint
CREATE TABLE `billing_fx_rates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`base_currency` varchar(8) NOT NULL,
	`target_currency` varchar(8) NOT NULL,
	`rate` varchar(32) NOT NULL,
	`source` varchar(64) NOT NULL DEFAULT 'exchangerate-api',
	`fetched_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `billing_fx_rates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `billing_quote_versions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`quote_id` int NOT NULL,
	`version_number` int NOT NULL,
	`subtotal_cents` bigint NOT NULL,
	`discount_cents` bigint NOT NULL DEFAULT 0,
	`tax_percent` int NOT NULL DEFAULT 15,
	`total_cents` bigint NOT NULL,
	`currency` varchar(8) NOT NULL DEFAULT 'ZAR',
	`line_items_snapshot` text NOT NULL,
	`change_notes` text,
	`created_by_user_id` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `billing_quote_versions_id` PRIMARY KEY(`id`)
);
