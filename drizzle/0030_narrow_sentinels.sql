CREATE TABLE `project_projection_unit_mixes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`scenarioId` int NOT NULL,
	`unitType` varchar(128) NOT NULL,
	`unitCount` int NOT NULL,
	`averageSqFt` int,
	`monthlyRent` int,
	`dataState` enum('projected','estimated') NOT NULL,
	`sourceReference` varchar(500),
	`effectiveAt` timestamp,
	`ownerName` varchar(255),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `project_projection_unit_mixes_id` PRIMARY KEY(`id`),
	CONSTRAINT `project_projection_unit_mix_owner_scenario_type_unique` UNIQUE(`ownerId`,`scenarioId`,`unitType`)
);
--> statement-breakpoint
ALTER TABLE `project_planning_financing_terms` ADD `financingFeeBps` int;