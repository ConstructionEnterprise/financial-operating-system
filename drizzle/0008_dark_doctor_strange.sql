ALTER TABLE `fundraising_documents` ADD `audience` varchar(128) DEFAULT 'General' NOT NULL;--> statement-breakpoint
ALTER TABLE `fundraising_documents` ADD `purpose` varchar(255) DEFAULT 'General fundraising' NOT NULL;--> statement-breakpoint
ALTER TABLE `fundraising_documents` ADD `replacesDocumentId` int;