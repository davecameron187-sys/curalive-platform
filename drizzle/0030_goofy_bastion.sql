CREATE TABLE `user_feedback` (
	`id` int AUTO_INCREMENT NOT NULL,
	`rating` int NOT NULL,
	`suggestion` text,
	`email` varchar(320),
	`user_id` int,
	`page_url` varchar(512) NOT NULL DEFAULT '/',
	`ip_address` varchar(64),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_feedback_id` PRIMARY KEY(`id`)
);
