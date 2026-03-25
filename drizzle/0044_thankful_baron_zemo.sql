ALTER TABLE `ai_generated_content` MODIFY COLUMN `approved_by` int NOT NULL DEFAULT 0;--> statement-breakpoint
ALTER TABLE `ai_generated_content` MODIFY COLUMN `approved_by` int NOT NULL;--> statement-breakpoint
ALTER TABLE `occ_transcript_edits` MODIFY COLUMN `approved_by` int NOT NULL DEFAULT 0;--> statement-breakpoint
ALTER TABLE `occ_transcript_edits` MODIFY COLUMN `approved_by` int NOT NULL;--> statement-breakpoint
ALTER TABLE `transcript_edits` MODIFY COLUMN `approved_by` int NOT NULL DEFAULT 0;--> statement-breakpoint
ALTER TABLE `transcript_edits` MODIFY COLUMN `approved_by` int NOT NULL;