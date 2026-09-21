CREATE TABLE `investor_documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`contactId` int NOT NULL,
	`documentId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `investor_documents_id` PRIMARY KEY(`id`),
	CONSTRAINT `investor_document_owner_unique` UNIQUE(`ownerId`,`contactId`,`documentId`)
);
--> statement-breakpoint
ALTER TABLE `fundraising_documents` ADD `version` varchar(64) DEFAULT 'v1' NOT NULL;--> statement-breakpoint
ALTER TABLE `fundraising_documents` ADD `status` enum('current','archived') DEFAULT 'current' NOT NULL;--> statement-breakpoint
ALTER TABLE `fundraising_documents` ADD `description` text;--> statement-breakpoint
ALTER TABLE `fundraising_documents` ADD `updatedAt` timestamp DEFAULT (now()) NOT NULL ON UPDATE CURRENT_TIMESTAMP;