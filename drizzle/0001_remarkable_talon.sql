CREATE TABLE `clubs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`logoUrl` text,
	`primaryColor` varchar(7) DEFAULT '#0E4C92',
	`secondaryColor` varchar(7) DEFAULT '#E31E24',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `clubs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `kpiTargets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clubId` int NOT NULL,
	`kpiName` varchar(255) NOT NULL,
	`metaG2` decimal(10,4),
	`metaG6` decimal(10,4),
	`unit` varchar(50),
	`category` enum('OFFENSIVE','DEFENSIVE','GENERAL') NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `kpiTargets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `kpiValues` (
	`id` int AUTO_INCREMENT NOT NULL,
	`matchId` int NOT NULL,
	`kpiId` int NOT NULL,
	`value` decimal(10,4),
	`period` enum('1T','2T','FULL') DEFAULT 'FULL',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `kpiValues_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `matches` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clubId` int NOT NULL,
	`date` timestamp NOT NULL,
	`opponent` varchar(255) NOT NULL,
	`competition` varchar(100) NOT NULL,
	`result` enum('W','D','L'),
	`goalsFor` int,
	`goalsAgainst` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `matches_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `performanceGoals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clubId` int NOT NULL,
	`playerId` int,
	`kpiId` int NOT NULL,
	`targetValue` decimal(10,4),
	`period` varchar(50) NOT NULL,
	`weight` float DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `performanceGoals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `playerStats` (
	`id` int AUTO_INCREMENT NOT NULL,
	`playerId` int NOT NULL,
	`matchId` int NOT NULL,
	`minutesPlayed` int,
	`goals` int DEFAULT 0,
	`assists` int DEFAULT 0,
	`shots` int DEFAULT 0,
	`shotsOnTarget` int DEFAULT 0,
	`passes` int DEFAULT 0,
	`passAccuracy` float,
	`tackles` int DEFAULT 0,
	`interceptions` int DEFAULT 0,
	`fouls` int DEFAULT 0,
	`yellowCards` int DEFAULT 0,
	`redCards` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `playerStats_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `players` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clubId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`position` enum('GK','DEF','MID','FWD') NOT NULL,
	`number` int,
	`birthDate` date,
	`nationality` varchar(100),
	`height` float,
	`weight` float,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `players_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `teamStats` (
	`id` int AUTO_INCREMENT NOT NULL,
	`matchId` int NOT NULL,
	`clubId` int NOT NULL,
	`possessionPct` float,
	`shots` int DEFAULT 0,
	`shotsOnTarget` int DEFAULT 0,
	`passes` int DEFAULT 0,
	`passAccuracy` float,
	`tackles` int DEFAULT 0,
	`interceptions` int DEFAULT 0,
	`fouls` int DEFAULT 0,
	`corners` int DEFAULT 0,
	`offsides` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `teamStats_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','admin','analyst','coach') NOT NULL DEFAULT 'user';--> statement-breakpoint
ALTER TABLE `users` ADD `clubId` int;