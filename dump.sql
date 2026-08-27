-- MySQL dump 10.13  Distrib 8.0.45, for Win64 (x86_64)
--
-- Host: naftal-gpipfe-karim19215-90ed.e.aivencloud.com    Database: defaultdb
-- ------------------------------------------------------
-- Server version	8.0.45

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
SET @MYSQLDUMP_TEMP_LOG_BIN = @@SESSION.SQL_LOG_BIN;
SET @@SESSION.SQL_LOG_BIN= 0;

--
-- GTID state at the beginning of the backup 
--

SET @@GLOBAL.GTID_PURGED=/*!80000 '+'*/ '6f587a62-17e1-11f1-bc7c-0ed9b939719a:1-25,
e2c746bc-196e-11f1-b028-82672d698e8a:1-628,
e7d1a603-1713-11f1-9890-6ed8690a2bac:1-30';

--
-- Table structure for table `categories`
--

DROP TABLE IF EXISTS `categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `categories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_8b0be371d28245da6e4f4b6187` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categories`
--

LOCK TABLES `categories` WRITE;
/*!40000 ALTER TABLE `categories` DISABLE KEYS */;
INSERT INTO `categories` VALUES (7,'Ecran hhh'),(2,'Imprimante check'),(3,'Imprimante Laser'),(4,'Imprimante Matricielle'),(12,'mohamed'),(11,'naftal'),(10,'natfal'),(5,'Onduleur ghgh'),(8,'PC testing'),(6,'Unite Centrale');
/*!40000 ALTER TABLE `categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `decharge_items`
--

DROP TABLE IF EXISTS `decharge_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `decharge_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `designation` varchar(255) NOT NULL,
  `quantity` int unsigned NOT NULL,
  `marque` varchar(255) DEFAULT NULL,
  `numeroSerie` varchar(255) DEFAULT NULL,
  `numeroInventaire` varchar(255) DEFAULT NULL,
  `dechargeId` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FK_aa2357e77157529e5a10630b71a` (`dechargeId`),
  CONSTRAINT `FK_aa2357e77157529e5a10630b71a` FOREIGN KEY (`dechargeId`) REFERENCES `decharges` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `decharge_items`
--

LOCK TABLES `decharge_items` WRITE;
/*!40000 ALTER TABLE `decharge_items` DISABLE KEYS */;
INSERT INTO `decharge_items` VALUES (8,'Lenovo Q12',1,'Lenovo','128762','128762',7),(9,'X',1,'X','14431','14324',8),(11,'kadkfa ajkgjkla',1,'kadkfa','231k4l','198329',10),(12,'Lenovo X13',1,'Lenovo','323324','12213',11),(13,'Lenovo Q12',1,'Lenovo','128762','128762',11);
/*!40000 ALTER TABLE `decharge_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `decharges`
--

DROP TABLE IF EXISTS `decharges`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `decharges` (
  `id` int NOT NULL AUTO_INCREMENT,
  `reference` varchar(255) NOT NULL,
  `maintenanceType` enum('HARD','SOFT') NOT NULL,
  `observation` text,
  `destinataire` varchar(255) NOT NULL,
  `receptionnaireNom` varchar(255) NOT NULL,
  `receptionnairePrenom` varchar(255) NOT NULL,
  `receptionnaireFonction` varchar(255) NOT NULL,
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `createdById` varchar(36) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_11668d44169250ec06714e1308` (`reference`),
  KEY `FK_b3d1bc95ae4975e6975415c76cd` (`createdById`),
  CONSTRAINT `FK_b3d1bc95ae4975e6975415c76cd` FOREIGN KEY (`createdById`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `decharges`
--

LOCK TABLES `decharges` WRITE;
/*!40000 ALTER TABLE `decharges` DISABLE KEYS */;
INSERT INTO `decharges` VALUES (7,'1/2026','HARD','Décharge liée aux interventions: 2/2026','Development','Bouazza','Karim','Tch','2026-04-09 10:55:54.354332','dd10101d-b0e3-4567-99bd-44380ae59403'),(8,'2/2026','SOFT','y','x','Mohamed','Meziane','ADMIN','2026-04-09 10:57:28.590907','dd10101d-b0e3-4567-99bd-44380ae59403'),(10,'3/2026','HARD','Décharge liée aux interventions: 3/2026','Ahmed Benali','Meziane','Mohamed','tech','2026-04-12 18:24:33.916073','59aea9ad-51b7-4705-b6fa-a6d902a125af'),(11,'4/2026','HARD','Décharge liée aux interventions: 5/2026, 2/2026','Derection General','Mohamed','Meziane','ADMIN','2026-04-19 11:08:22.980861','dd10101d-b0e3-4567-99bd-44380ae59403');
/*!40000 ALTER TABLE `decharges` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `departments`
--

DROP TABLE IF EXISTS `departments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `departments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `code` varchar(255) NOT NULL,
  `managerId` varchar(36) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_8681da666ad9699d568b3e9106` (`name`),
  UNIQUE KEY `IDX_91fddbe23e927e1e525c152baa` (`code`),
  UNIQUE KEY `REL_f6414ec030ca08823b25e03cd9` (`managerId`),
  CONSTRAINT `FK_f6414ec030ca08823b25e03cd9d` FOREIGN KEY (`managerId`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `departments`
--

LOCK TABLES `departments` WRITE;
/*!40000 ALTER TABLE `departments` DISABLE KEYS */;
INSERT INTO `departments` VALUES (5,'Development','IL','59aea9ad-51b7-4705-b6fa-a6d902a125af'),(6,'Cyber Security','SSI','dd10101d-b0e3-4567-99bd-44380ae59403'),(11,'Derection General','DG','afa8e76d-1e12-41c7-bbdd-c5b10f813f9f');
/*!40000 ALTER TABLE `departments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `intervention_items`
--

DROP TABLE IF EXISTS `intervention_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `intervention_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `designation` varchar(255) NOT NULL,
  `quantity` int unsigned NOT NULL,
  `marque` varchar(255) DEFAULT NULL,
  `numeroSerie` varchar(255) DEFAULT NULL,
  `numeroInventaire` varchar(255) DEFAULT NULL,
  `interventionId` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FK_51d18a6bd2cbfc6e9c67dca954e` (`interventionId`),
  CONSTRAINT `FK_51d18a6bd2cbfc6e9c67dca954e` FOREIGN KEY (`interventionId`) REFERENCES `interventions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `intervention_items`
--

LOCK TABLES `intervention_items` WRITE;
/*!40000 ALTER TABLE `intervention_items` DISABLE KEYS */;
INSERT INTO `intervention_items` VALUES (3,'Lenovo Q12',1,'Lenovo','128762','128762',2),(11,'kadkfa ajkgjkla',1,'kadkfa','231k4l','198329',5),(14,'Lenovo X13',1,'Lenovo','323324','12213',6),(16,'Lenovo X13',1,'Lenovo','323324','12213',7),(17,'Huawei e13',1,'Huawei e13','443243','443243',8);
/*!40000 ALTER TABLE `intervention_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `interventions`
--

DROP TABLE IF EXISTS `interventions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `interventions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `reference` varchar(255) NOT NULL,
  `interventionType` enum('HARD','SOFT') NOT NULL,
  `observation` text,
  `destinataire` varchar(255) NOT NULL,
  `interventionnaireNom` varchar(255) NOT NULL,
  `interventionnairePrenom` varchar(255) NOT NULL,
  `interventionnaireFonction` varchar(255) NOT NULL,
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `createdById` varchar(36) DEFAULT NULL,
  `status` enum('A_FAIRE','EN_COURS','TERMINE') NOT NULL DEFAULT 'A_FAIRE',
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_25f5f10187d1bc491e74cabfc7` (`reference`),
  KEY `FK_a0fc39ffa4583954a861909ddf4` (`createdById`),
  CONSTRAINT `FK_a0fc39ffa4583954a861909ddf4` FOREIGN KEY (`createdById`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `interventions`
--

LOCK TABLES `interventions` WRITE;
/*!40000 ALTER TABLE `interventions` DISABLE KEYS */;
INSERT INTO `interventions` VALUES (2,'2/2026','HARD',NULL,'Development','Bouazza','Karim','USER','2026-04-05 11:08:51.418217','59aea9ad-51b7-4705-b6fa-a6d902a125af','A_FAIRE'),(5,'3/2026','HARD',NULL,'Ahmed Benali','Meziane','Mohamed','tech','2026-04-07 10:15:22.401676','dd10101d-b0e3-4567-99bd-44380ae59403','TERMINE'),(6,'4/2026','HARD','critique','Development','Mohamed','Meziane','ADMIN','2026-04-13 19:47:45.852956','dd10101d-b0e3-4567-99bd-44380ae59403','TERMINE'),(7,'5/2026','HARD',NULL,'Derection General','Mohamed','Meziane','ADMIN','2026-04-19 11:06:18.638133','dd10101d-b0e3-4567-99bd-44380ae59403','TERMINE'),(8,'6/2026','HARD',NULL,'Derection General','Meziane','Mohamed','ADMIN','2026-04-19 12:49:38.116783','dd10101d-b0e3-4567-99bd-44380ae59403','A_FAIRE');
/*!40000 ALTER TABLE `interventions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `materiels`
--

DROP TABLE IF EXISTS `materiels`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `materiels` (
  `numeroSerie` varchar(255) NOT NULL,
  `dateEntree` date DEFAULT NULL,
  `etat` enum('En Service','En Panne','Reforme') NOT NULL,
  `marque` varchar(255) DEFAULT NULL,
  `modele` varchar(255) DEFAULT NULL,
  `categorieId` int NOT NULL,
  `proprietaireId` varchar(36) DEFAULT NULL,
  `numeroInventaire` varchar(255) NOT NULL,
  `serviceId` int DEFAULT NULL,
  `finGarontie` date DEFAULT NULL,
  `subsidiaryCode` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`numeroSerie`),
  UNIQUE KEY `IDX_3019636f10e5cc05eb535178b4` (`numeroInventaire`),
  KEY `FK_aeb6d2dcfe6cb5a5974c57718c0` (`categorieId`),
  KEY `FK_28c0b42d6618ad8b350761f712b` (`subsidiaryCode`),
  KEY `FK_04668611f9da2d214bb645a2f2e` (`proprietaireId`),
  KEY `FK_963eff260cc4d6d9345cc9f1a0b` (`serviceId`),
  CONSTRAINT `FK_04668611f9da2d214bb645a2f2e` FOREIGN KEY (`proprietaireId`) REFERENCES `users` (`id`),
  CONSTRAINT `FK_28c0b42d6618ad8b350761f712b` FOREIGN KEY (`subsidiaryCode`) REFERENCES `subsidiaries` (`code`),
  CONSTRAINT `FK_963eff260cc4d6d9345cc9f1a0b` FOREIGN KEY (`serviceId`) REFERENCES `services` (`id`),
  CONSTRAINT `FK_aeb6d2dcfe6cb5a5974c57718c0` FOREIGN KEY (`categorieId`) REFERENCES `categories` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `materiels`
--

LOCK TABLES `materiels` WRITE;
/*!40000 ALTER TABLE `materiels` DISABLE KEYS */;
INSERT INTO `materiels` VALUES ('123498','2026-03-31','En Service','dell latatituei12','X',7,'cb0660d2-8271-45da-801f-6d851bc4535a','123498',4,NULL,NULL),('1541','2026-04-02','En Service','X','s',3,'dd10101d-b0e3-4567-99bd-44380ae59403','404',NULL,'2037-10-27','K1921'),('231k4l','2026-04-30','En Service','kadkfa','ajkgjkla',3,'59aea9ad-51b7-4705-b6fa-a6d902a125af','198329',NULL,NULL,'T2'),('283948','2026-04-19','En Panne','adsf','asdf',7,'dd10101d-b0e3-4567-99bd-44380ae59403','23487128',2,NULL,NULL),('323324','2026-04-02','En Service','Lenovo','X13',8,'59aea9ad-51b7-4705-b6fa-a6d902a125af','12213',7,'2028-10-27',NULL),('443243','2026-03-30','Reforme','Huawei e13',NULL,5,'afa8e76d-1e12-41c7-bbdd-c5b10f813f9f','443243',4,NULL,NULL),('5433312','2026-03-29','En Service','Ecran Asus x3',NULL,7,'dd10101d-b0e3-4567-99bd-44380ae59403','5433312',5,NULL,NULL),('646353','2026-04-18','En Panne','jksdahf','asdf',3,'dd10101d-b0e3-4567-99bd-44380ae59403','13241',2,NULL,NULL);
/*!40000 ALTER TABLE `materiels` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `migrations`
--

DROP TABLE IF EXISTS `migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `migrations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `timestamp` bigint NOT NULL,
  `name` varchar(255) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=28 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `migrations`
--

LOCK TABLES `migrations` WRITE;
/*!40000 ALTER TABLE `migrations` DISABLE KEYS */;
INSERT INTO `migrations` VALUES (1,1772557731267,'Init1772557731267'),(2,1772639552722,'Init1772639552722'),(3,1772811134198,'Init1772811134198'),(4,1772827991405,'Init1772827991405'),(5,1772904678939,'Init1772904678939'),(6,1773330860000,'Init1773330860000'),(7,1773762577866,'Init1773762577866'),(8,1773763533252,'Init1773763533252'),(9,1773764705792,'Init1773764705792'),(10,1774000000000,'UniqueDepartmentCode1774000000000'),(11,1774288640197,'Init1774288640197'),(12,1774291941212,'Init1774291941212'),(13,1774292499441,'Init1774292499441'),(14,1775000000000,'CreateCategoriesTable1775000000000'),(15,1774715447755,'Init1774715447755'),(16,1775056930637,'Init1775056930637'),(17,1775071500663,'Init1775071500663'),(18,1775071742217,'Init1775071742217'),(19,1775072562706,'Init1775072562706'),(20,1775073383762,'Init1775073383762'),(21,1775077428777,'Init1775077428777'),(22,1775077913372,'Init1775077913372'),(23,1775078052543,'Init1775078052543'),(24,1775148663699,'Init1775148663699'),(25,1775150265678,'Init1775150265678'),(26,1775339092692,'Init1775339092692'),(27,1775502715753,'Init1775502715753');
/*!40000 ALTER TABLE `migrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `permissions`
--

DROP TABLE IF EXISTS `permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `permissions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_48ce552495d14eae9b187bb671` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=56 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `permissions`
--

LOCK TABLES `permissions` WRITE;
/*!40000 ALTER TABLE `permissions` DISABLE KEYS */;
INSERT INTO `permissions` VALUES (55,'chatbot'),(22,'create-category'),(42,'create-decharge'),(15,'create-department'),(45,'create-intervention'),(27,'create-materiel'),(10,'create-permission'),(20,'create-role'),(32,'create-service'),(37,'create-subsidiary'),(51,'create-user'),(26,'delete-category'),(50,'delete-decharge'),(19,'delete-department'),(49,'delete-intervention'),(31,'delete-materiel'),(14,'delete-permission'),(9,'delete-role'),(36,'delete-service'),(41,'delete-subsidiary'),(5,'delete-user'),(52,'export-all-data'),(23,'read-categories'),(43,'read-decharges'),(16,'read-departments'),(46,'read-interventions'),(28,'read-materiels'),(54,'read-my-materiels'),(12,'read-permission'),(11,'read-permissions'),(7,'read-roles'),(33,'read-services'),(38,'read-subsidiaries'),(2,'read-users'),(53,'update-category'),(18,'update-department'),(48,'update-intervention'),(30,'update-materiel'),(13,'update-permission'),(8,'update-role'),(35,'update-service'),(40,'update-subsidiary'),(4,'update-user');
/*!40000 ALTER TABLE `permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `roles`
--

DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `roles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_648e3f5447f725579d7d4ffdfb` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `roles`
--

LOCK TABLES `roles` WRITE;
/*!40000 ALTER TABLE `roles` DISABLE KEYS */;
INSERT INTO `roles` VALUES (1,'Admin'),(2,'Manager'),(5,'President'),(6,'Technicien');
/*!40000 ALTER TABLE `roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `services`
--

DROP TABLE IF EXISTS `services`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `services` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `code` varchar(255) NOT NULL,
  `departmentId` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_866a53514f6940cc86576400db` (`departmentId`,`code`),
  UNIQUE KEY `IDX_900cad62d637261bdf7295e874` (`departmentId`,`name`),
  CONSTRAINT `FK_9896dd19ab34a116cecf977836b` FOREIGN KEY (`departmentId`) REFERENCES `departments` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `services`
--

LOCK TABLES `services` WRITE;
/*!40000 ALTER TABLE `services` DISABLE KEYS */;
INSERT INTO `services` VALUES (1,'Z','E1234',5),(2,'A7A','UU',5),(4,'Service auto D11','AUTO-D11',11),(5,'Service auto D6','AUTO-D6',6),(7,'Service auto migration','AUTO-MIGRATION',5);
/*!40000 ALTER TABLE `services` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `subsidiaries`
--

DROP TABLE IF EXISTS `subsidiaries`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `subsidiaries` (
  `code` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  PRIMARY KEY (`code`),
  UNIQUE KEY `IDX_02a78cf30080bf9b52e8f856cb` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `subsidiaries`
--

LOCK TABLES `subsidiaries` WRITE;
/*!40000 ALTER TABLE `subsidiaries` DISABLE KEYS */;
INSERT INTO `subsidiaries` VALUES ('T2','milan'),('t1','paris'),('K60981','Rouiba'),('K1921','Saint Eugène');
/*!40000 ALTER TABLE `subsidiaries` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` varchar(36) NOT NULL,
  `nom` varchar(255) NOT NULL,
  `prenom` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `roleId` int DEFAULT NULL,
  `refreshToken` varchar(255) DEFAULT NULL,
  `departmentId` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_97672ac88f789774dd47f7c8be` (`email`),
  KEY `FK_368e146b785b574f42ae9e53d5e` (`roleId`),
  KEY `FK_554d853741f2083faaa5794d2ae` (`departmentId`),
  CONSTRAINT `FK_368e146b785b574f42ae9e53d5e` FOREIGN KEY (`roleId`) REFERENCES `roles` (`id`),
  CONSTRAINT `FK_554d853741f2083faaa5794d2ae` FOREIGN KEY (`departmentId`) REFERENCES `departments` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES ('44b1cfd6-335c-443f-9785-bb28d2af2cdf','sklab','Yasser','yasser@gmail.com','$2b$10$4269vPkGHHIYB8vOb9E3m.qSq1j0z0Kkmdfm2tViPaftmwoC/a/ZG','2026-03-18 13:32:31.988234','2026-04-02 10:59:27.000000',6,'$2b$10$cbr/8TQ4/TzacjPEf0Rh1e4nli4CACqbWSflhd5vOU5Gb9Oxl6Ptu',6),('59aea9ad-51b7-4705-b6fa-a6d902a125af','Karim','Bouazza','karim19213@gmail.com','$2b$10$ZH/aobFSlJcwUQ6Qgsy.Ve97Eu1bjynD4TFo5KbtHc3CrIv9zmKDG','2026-03-06 20:21:13.405290','2026-04-19 13:13:10.000000',5,'$2b$10$gL7yon/1z50ZJ5gPBtBeXubSmsJbir0g8Kt1gTZqvdrD34YhOi8ci',5),('a3c26e8b-e0e9-4791-8262-88b35c78fb3d','x','x','x@gmail.com','$2b$10$o8.3VvVOqBNBZ2oTsp/BSOi08hgYv7iEA6NmMW0g//0WFuSLyYKu2','2026-04-12 14:50:39.857420','2026-04-13 13:14:43.000000',6,'$2b$10$ZjmMHVyPlVHSmAVbtMOSJeMwcjCKha8/80w6qtiltfpwwAP7/QYpy',6),('afa8e76d-1e12-41c7-bbdd-c5b10f813f9f','Taha','Sahraoui','taha@gmail.com','$2b$10$w8ZKskFSrXRruW/CrMzR0OeuGvHmlZ/KF5EU.b2D4ZMKA6AjXQbZm','2026-03-18 13:30:59.550904','2026-04-15 18:19:01.000000',2,'$2b$10$B3AirrPEQ749tSKl7HMDgupWv.OuYmaNdhzEL8MoTTkWBoFyf9xyC',11),('cb0660d2-8271-45da-801f-6d851bc4535a','lounas','Rachid','rachid.lounas@natfal.dz','$2b$10$LqZUvTxGQGFR4K9mocDRyOiCwJT4d.kD437gVw3NmRvJXMamALSgy','2026-03-31 10:27:44.582769','2026-03-31 10:28:08.000000',6,'$2b$10$PMVSpRE5S2e8IsocuveXlOGarf7Kjk4hH3Ad8VvfyEYTrCLDinjBu',11),('dd10101d-b0e3-4567-99bd-44380ae59403','Mohamed','Meziane','moh@gmail.com','$2b$10$NbUX0bt2jCfdncmiE6Ms4uDdCMBHtbuF8xQtPmYgcbeiElnl7NqtW','2026-03-18 12:54:11.031968','2026-04-19 10:51:17.000000',1,'$2b$10$wgeOyj0MGq1PhNZcegqo2uaQI1FEzGmUdIBBDNhj7SHhetjsNlPtW',6);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users_permissions_permissions`
--

DROP TABLE IF EXISTS `users_permissions_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users_permissions_permissions` (
  `usersId` varchar(36) NOT NULL,
  `permissionsId` int NOT NULL,
  PRIMARY KEY (`usersId`,`permissionsId`),
  KEY `IDX_b70d6dbde0e342b2afd199490c` (`usersId`),
  KEY `IDX_f417b3a2e38339487716aa0742` (`permissionsId`),
  CONSTRAINT `FK_b70d6dbde0e342b2afd199490cc` FOREIGN KEY (`usersId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `FK_f417b3a2e38339487716aa0742a` FOREIGN KEY (`permissionsId`) REFERENCES `permissions` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users_permissions_permissions`
--

LOCK TABLES `users_permissions_permissions` WRITE;
/*!40000 ALTER TABLE `users_permissions_permissions` DISABLE KEYS */;
INSERT INTO `users_permissions_permissions` VALUES ('44b1cfd6-335c-443f-9785-bb28d2af2cdf',2),('59aea9ad-51b7-4705-b6fa-a6d902a125af',2),('a3c26e8b-e0e9-4791-8262-88b35c78fb3d',2),('afa8e76d-1e12-41c7-bbdd-c5b10f813f9f',2),('dd10101d-b0e3-4567-99bd-44380ae59403',2),('59aea9ad-51b7-4705-b6fa-a6d902a125af',4),('dd10101d-b0e3-4567-99bd-44380ae59403',4),('59aea9ad-51b7-4705-b6fa-a6d902a125af',5),('dd10101d-b0e3-4567-99bd-44380ae59403',5),('44b1cfd6-335c-443f-9785-bb28d2af2cdf',7),('59aea9ad-51b7-4705-b6fa-a6d902a125af',7),('afa8e76d-1e12-41c7-bbdd-c5b10f813f9f',7),('dd10101d-b0e3-4567-99bd-44380ae59403',7),('59aea9ad-51b7-4705-b6fa-a6d902a125af',8),('dd10101d-b0e3-4567-99bd-44380ae59403',8),('59aea9ad-51b7-4705-b6fa-a6d902a125af',9),('dd10101d-b0e3-4567-99bd-44380ae59403',9),('59aea9ad-51b7-4705-b6fa-a6d902a125af',10),('dd10101d-b0e3-4567-99bd-44380ae59403',10),('44b1cfd6-335c-443f-9785-bb28d2af2cdf',11),('59aea9ad-51b7-4705-b6fa-a6d902a125af',11),('dd10101d-b0e3-4567-99bd-44380ae59403',11),('44b1cfd6-335c-443f-9785-bb28d2af2cdf',12),('59aea9ad-51b7-4705-b6fa-a6d902a125af',12),('afa8e76d-1e12-41c7-bbdd-c5b10f813f9f',12),('dd10101d-b0e3-4567-99bd-44380ae59403',12),('59aea9ad-51b7-4705-b6fa-a6d902a125af',13),('dd10101d-b0e3-4567-99bd-44380ae59403',13),('59aea9ad-51b7-4705-b6fa-a6d902a125af',14),('dd10101d-b0e3-4567-99bd-44380ae59403',14),('59aea9ad-51b7-4705-b6fa-a6d902a125af',15),('a3c26e8b-e0e9-4791-8262-88b35c78fb3d',15),('dd10101d-b0e3-4567-99bd-44380ae59403',15),('44b1cfd6-335c-443f-9785-bb28d2af2cdf',16),('59aea9ad-51b7-4705-b6fa-a6d902a125af',16),('a3c26e8b-e0e9-4791-8262-88b35c78fb3d',16),('dd10101d-b0e3-4567-99bd-44380ae59403',16),('59aea9ad-51b7-4705-b6fa-a6d902a125af',18),('dd10101d-b0e3-4567-99bd-44380ae59403',18),('59aea9ad-51b7-4705-b6fa-a6d902a125af',19),('dd10101d-b0e3-4567-99bd-44380ae59403',19),('59aea9ad-51b7-4705-b6fa-a6d902a125af',20),('dd10101d-b0e3-4567-99bd-44380ae59403',20),('59aea9ad-51b7-4705-b6fa-a6d902a125af',22),('a3c26e8b-e0e9-4791-8262-88b35c78fb3d',22),('dd10101d-b0e3-4567-99bd-44380ae59403',22),('44b1cfd6-335c-443f-9785-bb28d2af2cdf',23),('59aea9ad-51b7-4705-b6fa-a6d902a125af',23),('a3c26e8b-e0e9-4791-8262-88b35c78fb3d',23),('dd10101d-b0e3-4567-99bd-44380ae59403',23),('59aea9ad-51b7-4705-b6fa-a6d902a125af',26),('dd10101d-b0e3-4567-99bd-44380ae59403',26),('44b1cfd6-335c-443f-9785-bb28d2af2cdf',27),('59aea9ad-51b7-4705-b6fa-a6d902a125af',27),('dd10101d-b0e3-4567-99bd-44380ae59403',27),('59aea9ad-51b7-4705-b6fa-a6d902a125af',28),('dd10101d-b0e3-4567-99bd-44380ae59403',28),('44b1cfd6-335c-443f-9785-bb28d2af2cdf',30),('59aea9ad-51b7-4705-b6fa-a6d902a125af',30),('dd10101d-b0e3-4567-99bd-44380ae59403',30),('59aea9ad-51b7-4705-b6fa-a6d902a125af',31),('dd10101d-b0e3-4567-99bd-44380ae59403',31),('59aea9ad-51b7-4705-b6fa-a6d902a125af',32),('dd10101d-b0e3-4567-99bd-44380ae59403',32),('59aea9ad-51b7-4705-b6fa-a6d902a125af',33),('dd10101d-b0e3-4567-99bd-44380ae59403',33),('59aea9ad-51b7-4705-b6fa-a6d902a125af',35),('dd10101d-b0e3-4567-99bd-44380ae59403',35),('59aea9ad-51b7-4705-b6fa-a6d902a125af',36),('dd10101d-b0e3-4567-99bd-44380ae59403',36),('59aea9ad-51b7-4705-b6fa-a6d902a125af',37),('dd10101d-b0e3-4567-99bd-44380ae59403',37),('59aea9ad-51b7-4705-b6fa-a6d902a125af',38),('dd10101d-b0e3-4567-99bd-44380ae59403',38),('59aea9ad-51b7-4705-b6fa-a6d902a125af',40),('dd10101d-b0e3-4567-99bd-44380ae59403',40),('59aea9ad-51b7-4705-b6fa-a6d902a125af',41),('dd10101d-b0e3-4567-99bd-44380ae59403',41),('59aea9ad-51b7-4705-b6fa-a6d902a125af',42),('a3c26e8b-e0e9-4791-8262-88b35c78fb3d',42),('dd10101d-b0e3-4567-99bd-44380ae59403',42),('59aea9ad-51b7-4705-b6fa-a6d902a125af',43),('a3c26e8b-e0e9-4791-8262-88b35c78fb3d',43),('dd10101d-b0e3-4567-99bd-44380ae59403',43),('59aea9ad-51b7-4705-b6fa-a6d902a125af',45),('dd10101d-b0e3-4567-99bd-44380ae59403',45),('59aea9ad-51b7-4705-b6fa-a6d902a125af',46),('dd10101d-b0e3-4567-99bd-44380ae59403',46),('59aea9ad-51b7-4705-b6fa-a6d902a125af',48),('dd10101d-b0e3-4567-99bd-44380ae59403',48),('59aea9ad-51b7-4705-b6fa-a6d902a125af',49),('dd10101d-b0e3-4567-99bd-44380ae59403',49),('59aea9ad-51b7-4705-b6fa-a6d902a125af',50),('dd10101d-b0e3-4567-99bd-44380ae59403',50),('59aea9ad-51b7-4705-b6fa-a6d902a125af',51),('dd10101d-b0e3-4567-99bd-44380ae59403',51),('59aea9ad-51b7-4705-b6fa-a6d902a125af',52),('dd10101d-b0e3-4567-99bd-44380ae59403',52),('59aea9ad-51b7-4705-b6fa-a6d902a125af',53),('dd10101d-b0e3-4567-99bd-44380ae59403',53),('59aea9ad-51b7-4705-b6fa-a6d902a125af',54),('dd10101d-b0e3-4567-99bd-44380ae59403',54);
/*!40000 ALTER TABLE `users_permissions_permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping routines for database 'defaultdb'
--
SET @@SESSION.SQL_LOG_BIN = @MYSQLDUMP_TEMP_LOG_BIN;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-04-20 13:53:28
