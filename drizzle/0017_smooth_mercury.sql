CREATE TABLE `roi_jv_contribution_components` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`capitalSourceId` int NOT NULL,
	`contributor` enum('ce','partner') NOT NULL,
	`componentType` enum('cash','technology','equipment','operations','ip_systems','land','facility','financing','development_services','other') NOT NULL,
	`amount` int NOT NULL,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `roi_jv_contribution_components_id` PRIMARY KEY(`id`)
);
