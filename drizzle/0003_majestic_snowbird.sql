CREATE TABLE `gmail_connections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`email` varchar(320) NOT NULL,
	`refreshTokenEncrypted` text,
	`connectedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `gmail_connections_id` PRIMARY KEY(`id`),
	CONSTRAINT `gmail_connections_ownerId_unique` UNIQUE(`ownerId`)
);
