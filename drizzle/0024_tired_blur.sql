CREATE TABLE `project_economics_input_documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`modelInputId` int NOT NULL,
	`documentId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `project_economics_input_documents_id` PRIMARY KEY(`id`),
	CONSTRAINT `project_economics_input_document_owner_unique` UNIQUE(`ownerId`,`modelInputId`,`documentId`)
);
--> statement-breakpoint
CREATE TABLE `project_economics_inputs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`modelId` int NOT NULL,
	`inputArea` enum('uses','operations','sources') NOT NULL,
	`inputCategory` varchar(128) NOT NULL,
	`inputName` varchar(255) NOT NULL,
	`value` int,
	`valueUnit` enum('usd','units','percentage_bps','hours','other') NOT NULL DEFAULT 'usd',
	`dataState` enum('actual','projected','estimated','missing') NOT NULL DEFAULT 'missing',
	`sourceReference` varchar(500),
	`effectiveAt` timestamp,
	`ownerName` varchar(255),
	`linkedCapitalOpportunityId` int,
	`notes` text,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `project_economics_inputs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `project_economics_models` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`internalProjectId` int NOT NULL,
	`modelName` varchar(255) NOT NULL,
	`modelStatus` enum('shell','active','archived') NOT NULL DEFAULT 'shell',
	`horizonMonths` int NOT NULL DEFAULT 36,
	`modelStartAt` timestamp,
	`modelStartDataState` enum('actual','projected','estimated','missing') NOT NULL DEFAULT 'missing',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `project_economics_models_id` PRIMARY KEY(`id`),
	CONSTRAINT `project_economics_model_owner_project_unique` UNIQUE(`ownerId`,`internalProjectId`)
);
--> statement-breakpoint
CREATE TABLE `project_economics_monthly_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`modelId` int NOT NULL,
	`monthIndex` int NOT NULL,
	`phase` enum('predevelopment','construction','commissioning','operating_ramp') NOT NULL,
	`category` enum('capex','draw','operating_cash_flow','debt_service','grant_disbursement','revenue_collections') NOT NULL,
	`amount` int,
	`dataState` enum('actual','projected','estimated','missing') NOT NULL DEFAULT 'missing',
	`sourceReference` varchar(500),
	`effectiveAt` timestamp,
	`ownerName` varchar(255),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `project_economics_monthly_items_id` PRIMARY KEY(`id`),
	CONSTRAINT `project_economics_month_item_owner_unique` UNIQUE(`ownerId`,`modelId`,`monthIndex`,`category`)
);
