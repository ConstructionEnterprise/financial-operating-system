CREATE TABLE `campaign_documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`campaignId` int NOT NULL,
	`documentId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `campaign_documents_id` PRIMARY KEY(`id`),
	CONSTRAINT `campaign_document_owner_unique` UNIQUE(`ownerId`,`campaignId`,`documentId`)
);
--> statement-breakpoint
CREATE TABLE `fundraising_documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`category` varchar(128) NOT NULL DEFAULT 'Supporting material',
	`mimeType` varchar(255) NOT NULL,
	`storageKey` varchar(512) NOT NULL,
	`storageUrl` text NOT NULL,
	`sizeBytes` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `fundraising_documents_id` PRIMARY KEY(`id`)
);
