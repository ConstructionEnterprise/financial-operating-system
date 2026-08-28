CREATE TABLE `internal_project_capital_need_strategies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`capitalNeedId` int NOT NULL,
	`strategyType` enum('equity','facility_jv','equipment_finance','grants','other') NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `internal_project_capital_need_strategies_id` PRIMARY KEY(`id`),
	CONSTRAINT `internal_project_need_strategy_owner_unique` UNIQUE(`ownerId`,`capitalNeedId`,`strategyType`)
);
--> statement-breakpoint
CREATE TABLE `internal_project_capital_needs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`internalProjectId` int NOT NULL,
	`requirementName` varchar(255) NOT NULL,
	`requirementCategory` varchar(128) NOT NULL DEFAULT 'other',
	`amount` int,
	`amountDataState` enum('actual','projected','estimated','missing') NOT NULL DEFAULT 'missing',
	`notes` text,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `internal_project_capital_needs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `internal_project_documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`internalProjectId` int NOT NULL,
	`documentId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `internal_project_documents_id` PRIMARY KEY(`id`),
	CONSTRAINT `internal_project_document_owner_unique` UNIQUE(`ownerId`,`internalProjectId`,`documentId`)
);
--> statement-breakpoint
CREATE TABLE `internal_projects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`projectName` varchar(255) NOT NULL,
	`projectCode` varchar(128),
	`projectType` varchar(128),
	`location` varchar(255),
	`projectStatus` enum('planning','active','on_hold','completed','cancelled') NOT NULL DEFAULT 'planning',
	`developmentStage` enum('concept','predevelopment','development','construction','commissioning','operations','completed') NOT NULL DEFAULT 'concept',
	`sponsorEntity` varchar(255),
	`totalProjectCost` int,
	`totalProjectCostDataState` enum('actual','projected','estimated','missing') NOT NULL DEFAULT 'missing',
	`capitalRequirement` int,
	`capitalRequirementDataState` enum('actual','projected','estimated','missing') NOT NULL DEFAULT 'missing',
	`targetCompletionAt` timestamp,
	`linkedFfProject` varchar(255),
	`roiProjectId` int,
	`description` text,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `internal_projects_id` PRIMARY KEY(`id`),
	CONSTRAINT `internal_project_owner_name_unique` UNIQUE(`ownerId`,`projectName`),
	CONSTRAINT `internal_project_owner_code_unique` UNIQUE(`ownerId`,`projectCode`)
);
