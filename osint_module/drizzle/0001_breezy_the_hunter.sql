CREATE TABLE `search_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`matricula` varchar(100) NOT NULL,
	`cidade` varchar(255) NOT NULL,
	`estado` varchar(2) NOT NULL,
	`orgao` text,
	`cargo` text,
	`queryString` text NOT NULL,
	`resultCount` int NOT NULL DEFAULT 0,
	`fromCache` int NOT NULL DEFAULT 0,
	`responseTime` int NOT NULL,
	`resultsUrl` text,
	`status` enum('success','error','empty') NOT NULL,
	`errorMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `search_history_id` PRIMARY KEY(`id`)
);
