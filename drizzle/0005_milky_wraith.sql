ALTER TABLE `campaigns` ADD `groupName` varchar(128) DEFAULT 'Ungrouped' NOT NULL;--> statement-breakpoint
ALTER TABLE `campaigns` ADD `sortOrder` int DEFAULT 0 NOT NULL;