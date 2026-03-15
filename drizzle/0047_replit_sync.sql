CREATE TABLE IF NOT EXISTS `mailing_lists` (
  `id` int AUTO_INCREMENT PRIMARY KEY NOT NULL,
  `event_id` varchar(128) NOT NULL,
  `name` varchar(255) NOT NULL,
  `status` enum('draft','processing','ready','sending','sent') NOT NULL DEFAULT 'draft',
  `total_entries` int NOT NULL DEFAULT 0,
  `processed_entries` int NOT NULL DEFAULT 0,
  `emailed_entries` int NOT NULL DEFAULT 0,
  `registered_entries` int NOT NULL DEFAULT 0,
  `webhook_url` varchar(512),
  `default_join_method` enum('phone','teams','zoom','web'),
  `pre_registered` boolean NOT NULL DEFAULT false,
  `created_at` timestamp NOT NULL DEFAULT (now()),
  `updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS `mailing_list_entries` (
  `id` int AUTO_INCREMENT PRIMARY KEY NOT NULL,
  `mailing_list_id` int NOT NULL,
  `first_name` varchar(255) NOT NULL,
  `last_name` varchar(255) NOT NULL,
  `email` varchar(320) NOT NULL,
  `company` varchar(255),
  `job_title` varchar(255),
  `access_pin` varchar(8),
  `status` enum('pending','pin_assigned','emailed','clicked','registered') NOT NULL DEFAULT 'pending',
  `join_method` enum('phone','teams','zoom','web'),
  `registration_id` int,
  `confirm_token` varchar(64),
  `email_sent_at` timestamp,
  `clicked_at` timestamp,
  `registered_at` timestamp,
  `created_at` timestamp NOT NULL DEFAULT (now())
);

CREATE TABLE IF NOT EXISTS `crm_api_keys` (
  `id` int AUTO_INCREMENT PRIMARY KEY NOT NULL,
  `key_hash` varchar(128) NOT NULL,
  `key_prefix` varchar(12) NOT NULL,
  `name` varchar(255) NOT NULL,
  `event_id` varchar(128),
  `permissions` json NOT NULL,
  `active` boolean NOT NULL DEFAULT true,
  `last_used_at` timestamp,
  `created_at` timestamp NOT NULL DEFAULT (now())
);
