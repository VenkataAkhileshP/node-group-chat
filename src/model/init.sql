-- Command to run in terminal to create the tables
-- mysql -hlocalhost -uroot -pChange123 -P3306 < init.sql

-- Drop and create a new database --
DROP DATABASE IF EXISTS `db_group_chat_rk`;
CREATE DATABASE IF NOT EXISTS `db_group_chat_rk`
  DEFAULT CHARACTER SET utf8
  COLLATE utf8_general_ci;

USE `db_group_chat_rk`;

-- Create table for the users --
DROP TABLE IF EXISTS `User`;
CREATE TABLE IF NOT EXISTS `User`(
	`id`        INT AUTO_INCREMENT,
  `userName`  VARCHAR(255) NOT NULL,
  `password`  VARCHAR(1024) NOT NULL,
	`firstName` VARCHAR(255) NOT NULL,
	`lastName`  VARCHAR(255) NOT NULL,
	`gender`    ENUM('MALE', 'FEMALE', 'OTHER', 'NA') NOT NULL DEFAULT 'NA',
  `createdOn` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `valid`     TINYINT(1)  NOT NULL DEFAULT 1,
	PRIMARY KEY id_pk (`id`)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8;

-- Create table for the groups --
DROP TABLE IF EXISTS `Group`;
CREATE TABLE IF NOT EXISTS `Group`(
	`id`        INT AUTO_INCREMENT,
  `name`      VARCHAR(255) NOT NULL,
  `ownerId`   INT NOT NULL,
  `createdOn` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `valid`     TINYINT(1)  NOT NULL DEFAULT 1,
	PRIMARY KEY id_pk (`id`)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8;

DROP TABLE IF EXISTS `Group_Member`;
CREATE TABLE IF NOT EXISTS `Group_Member`(
  `id`        INT AUTO_INCREMENT,
	`groupId`   INT NOT NULL,
	`userId`    INT NOT NULL,
  `roleType`  ENUM('ADMIN', 'MEMBER') NOT NULL DEFAULT 'MEMBER',
  `createdOn` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `valid`     TINYINT(1)  NOT NULL DEFAULT 1,
	CONSTRAINT `GroupMember_Group_FK`
    FOREIGN KEY (`groupId`)
    REFERENCES `Group` (`id`),
	CONSTRAINT `GroupMember_User_FK`
    FOREIGN KEY (`userId`)
    REFERENCES `User` (`id`),
  PRIMARY KEY id_pk (`id`)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8;

-- Create tables related to messages --
DROP TABLE IF EXISTS `Message`;
CREATE TABLE IF NOT EXISTS `Message`(
	`id`          INT AUTO_INCREMENT,
	`groupId`     INT NOT NULL,
	`userId`      INT NOT NULL,
	`createdOn`   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `valid`       TINYINT(1) NOT NULL DEFAULT 1,
	`messageText` VARCHAR(1024),
	dateCreated TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `Message_User_FK`
    FOREIGN KEY (`userId`)
    REFERENCES `User` (`id`),
	CONSTRAINT `Message_Group_FK`
    FOREIGN KEY (`groupId`)
    REFERENCES `Group` (`id`),
	PRIMARY KEY id_pk (`id`)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8;

DROP TABLE IF EXISTS `Message_Liked`;
CREATE TABLE IF NOT EXISTS `Message_Liked`(
	`id`          INT AUTO_INCREMENT,
  `isLiked`     TINYINT(1) NOT NULL DEFAULT 1,
	`messageId`   INT NOT NULL,
	`userId`      INT NOT NULL,
	`createdOn`   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `valid`       TINYINT(1) NOT NULL DEFAULT 1,
	UNIQUE (`messageId`, `userId`),
	CONSTRAINT `Message_Liked_User_FK`
    FOREIGN KEY (`userId`)
    REFERENCES `User` (`id`),
	CONSTRAINT `Message_Liked_Message_FK`
    FOREIGN KEY (`messageId`)
    REFERENCES `Message` (`id`),
  PRIMARY KEY id_pk (`id`)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8;


-- -- Populate Database --
-- -- Create 3 users
-- INSERT INTO Person (firstName, lastName, birthDate) VALUES ('Thanujan', 'Nandakumar', '1997-07-24'); -- personId = 1
-- INSERT INTO Person (firstName, lastName, birthDate) VALUES ('Test', 'User', '1999-03-02'); -- personId = 2
-- INSERT INTO Person (firstName, lastName, birthDate) VALUES ('Waterloo', 'Student', '1996-04-15'); -- personId = 3

-- -- Create 3 posts
-- INSERT INTO Post (personId, topicId, text) VALUES (1, 1, 'Programming question?'); -- postId = 1
-- INSERT INTO Post (personId, topicId, text) VALUES (2, 2, 'Math question?'); -- postId = 2
-- INSERT INTO Post (personId, topicId, text) VALUES (3, 4, 'Health question?'); -- postId = 3

-- -- Create 3 responses
-- INSERT INTO Post(personId, topicId, text) VALUES (1, 2, 'Response to Math question'); -- postId = 4
-- INSERT INTO Response_Post(responsePostId, parentPostId) VALUES (4, 2);
-- INSERT INTO Post(personId, topicId, text) VALUES (2, 4, 'Response to Health question'); -- postId = 5
-- INSERT INTO Response_Post(responsePostId, parentPostId) VALUES (5, 3);

-- -- Make user 2 like the first post
-- INSERT INTO Post_Reaction (postId, personId, isLiked) VALUES (1, 2, 1);

-- -- Make user 3 dislike the second post
-- INSERT INTO Post_Reaction (postId, personId, isLiked) VALUES (2, 3, 0);

-- -- Create a group
-- INSERT INTO Group_Info (name) VALUES ('Warriors'); -- groupId = 1

-- -- Add user 2 to the Warriors group
-- INSERT INTO Group_Member (groupId, personId) VALUES (1, 2);

-- -- Create 2 posts for Food and Pizza
-- INSERT INTO Post (personId, topicId, text) VALUES (1, 3, 'Food statement'); -- postId = 6
-- INSERT INTO Post (personId, topicId, text) VALUES (1, 5, 'Pizza Statement'); -- postId = 7