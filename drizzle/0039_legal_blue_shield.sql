CREATE TABLE `occ_live_rolling_summaries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`conference_id` int NOT NULL,
	`summary` text NOT NULL,
	`window_start_time` bigint NOT NULL,
	`window_end_time` bigint NOT NULL,
	`segment_count` int NOT NULL,
	`generated_at` timestamp NOT NULL DEFAULT (now()),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `occ_live_rolling_summaries_id` PRIMARY KEY(`id`)
);
