CREATE TABLE IF NOT EXISTS `broadcasts` (
  `id` int AUTO_INCREMENT PRIMARY KEY NOT NULL,
  `event_id` varchar(128),
  `title` varchar(255) NOT NULL,
  `mode` enum('audio','video','video_only') NOT NULL,
  `status` enum('ready','live','stopped','error') NOT NULL DEFAULT 'ready',
  `quality` enum('480p','720p','1080p') DEFAULT '720p',
  `bitrate` int,
  `latency` int,
  `viewer_count` int DEFAULT 0,
  `peak_viewers` int DEFAULT 0,
  `duration` int DEFAULT 0,
  `share_url` varchar(1024),
  `mux_stream_id` varchar(128),
  `mux_playback_id` varchar(128),
  `auto_record` boolean NOT NULL DEFAULT true,
  `allow_chat` boolean NOT NULL DEFAULT true,
  `operator_id` int,
  `started_at` timestamp,
  `stopped_at` timestamp,
  `created_at` timestamp NOT NULL DEFAULT (now()),
  `updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS `broadcast_metrics` (
  `id` int AUTO_INCREMENT PRIMARY KEY NOT NULL,
  `broadcast_id` int NOT NULL,
  `viewer_count` int DEFAULT 0,
  `bitrate` int,
  `latency` int,
  `cpu_usage` float,
  `buffer_health` float,
  `dropped_frames` int DEFAULT 0,
  `recorded_at` timestamp NOT NULL DEFAULT (now())
);

CREATE TABLE IF NOT EXISTS `broadcast_events` (
  `id` int AUTO_INCREMENT PRIMARY KEY NOT NULL,
  `broadcast_id` int NOT NULL,
  `event_type` varchar(64) NOT NULL,
  `detail` text,
  `created_at` timestamp NOT NULL DEFAULT (now())
);

CREATE TABLE IF NOT EXISTS `broadcast_archives` (
  `id` int AUTO_INCREMENT PRIMARY KEY NOT NULL,
  `broadcast_id` int NOT NULL,
  `recording_url` varchar(1024),
  `duration` int,
  `file_size` int,
  `format` varchar(32) DEFAULT 'mp4',
  `s3_key` varchar(512),
  `created_at` timestamp NOT NULL DEFAULT (now())
);
