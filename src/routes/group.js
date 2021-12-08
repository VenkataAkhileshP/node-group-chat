const express = require("express");
const router = express.Router();
const jwt = require('jsonwebtoken');

require('dotenv').config();
const pool = require('../model/db').pool;

const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY || 'kjfksfsdjflkdsjflkjsdlfkjhsdlkfj@#*(&@*!^#&@gfdsfdsf';
const GROUP_ROLES = ['ADMIN', 'MEMBER'];

// Create a group
router.post("/create", async (req, res) => {
  const { authorization } = req.headers;
  const { groupName } = req.body;

  let tokenDecoded;

  try {
    tokenDecoded = jwt.verify(authorization, JWT_SECRET_KEY);
  } catch (err) {
    return res.status(400).send({ errorMessage: err.message });
  }

  if (!authorization || !tokenDecoded || !tokenDecoded.id || !groupName ) {
    return res.status(400).json({
      status: "FAILED",
      message: "Empty input fields!",
    });
  }

  try {
    const records = await pool.query("SELECT * FROM `Group` WHERE `name` = ?", [groupName]);

    if (records.length) {
      return res.json({
        status: "FAILED",
        message: "Group with the given name already exists",
      });
    }
  } catch (err) {
    return res.status(400).send({ errorMessage: err.message });
  }

  let result;
  try {
    const newGroup = {
      name: groupName,
      ownerId: tokenDecoded.id
    };

    await pool.query("INSERT INTO `Group` set ?", [newGroup]);

    result = await pool.query("SELECT * FROM `Group` WHERE `name` = ?", [newGroup.name]);

    if (result.length < 1 || !result[0] || !result[0].id) {
      return res.status(400).send({ errorMessage: "Error while inserting the record, please try again" });
    } else {
      result = result[0];
    }

    const newGroupMember = {
      groupId: result.id,
      userId: tokenDecoded.id,
      roleType: 'ADMIN'
    };

    await pool.query("INSERT INTO `Group_Member` set ?", [newGroupMember]);

  } catch (err) {
    return res.status(400).send({ errorMessage: err.message });
  }

  return res.status(201).json({
    status: "SUCCESS",
    message: "Group successfully created",
    data: result
  });
});

// Delete a group
router.delete("/:groupId", async (req, res) => {
  const { authorization } = req.headers;
  const { groupId } = req.params;

  let tokenDecoded;

  try {
    tokenDecoded = jwt.verify(authorization, JWT_SECRET_KEY);
  } catch (err) {
    return res.status(400).send({ errorMessage: err.message });
  }

  if (!authorization || !tokenDecoded || !tokenDecoded.id || !groupId ) {
    return res.status(400).json({
      status: "FAILED",
      message: "Empty input fields!",
    });
  }

  try {
    const records = await pool.query("SELECT * FROM `Group` WHERE `id` = ?", [groupId]);

    if (records.length < 1) {
      return res.json({
        status: "FAILED",
        message: "Group with the given id doesn't exists",
      });
    }
  } catch (err) {
    return res.status(400).send({ errorMessage: err.message });
  }

  try {
    await pool.query("DELETE FROM `Message` WHERE `groupId` = ?", [groupId]);
    await pool.query("DELETE FROM `Group_Member` WHERE `groupId` = ?", [groupId]);
    await pool.query("DELETE FROM `Group` WHERE `id` = ?", [groupId]);
  } catch (err) {
    return res.status(400).send({ errorMessage: err.message });
  }

  return res.status(200).json({
    status: "SUCCESS",
    message: "Group successfully deleted"
  });
});

// Get all the groups where user is a part
router.get("/groups", async (req, res) => {
  const { authorization } = req.headers;

  let tokenDecoded;
  let adminGroups = [];
  let memberGroups = [];

  try {
    tokenDecoded = jwt.verify(authorization, JWT_SECRET_KEY);
  } catch (err) {
    return res.status(400).send({ errorMessage: err.message });
  }

  if (!authorization || !tokenDecoded || !tokenDecoded.id) {
    return res.status(400).json({
      status: "FAILED",
      message: "Empty input fields!",
    });
  }

  const userId = tokenDecoded.id;

  try {
    const adminRecords = await pool.query("SELECT * FROM `Group_Member` WHERE `userId` = ? AND `roleType` = ?", [userId, 'ADMIN']);
    const memberRecords = await pool.query("SELECT * FROM `Group_Member` WHERE `userId` = ? AND `roleType` = ?", [userId, 'MEMBER']);

    if (adminRecords.length < 1 && memberRecords.length < 1) {
      return res.json({
        status: "FAILED",
        message: "User is not present in any group",
      });
    }

    if (adminRecords.length > 0) adminGroups = adminRecords.filter((group) => group.id).map((group) => group.id);
    if (memberRecords.length > 0) memberGroups = memberRecords.filter((group) => group.id).map((group) => group.id);
  } catch (err) {
    return res.status(400).send({ errorMessage: err.message });
  }

  return res.status(200).json({
    status: "SUCCESS",
    message: "Group successfully deleted",
    adminGroups,
    memberGroups
  });
});

// Add users to a group
router.post("/addUser", async (req, res) => {
  const { authorization } = req.headers;
  const { groupId, userId, roleType } = req.body;

  let tokenDecoded;

  try {
    tokenDecoded = jwt.verify(authorization, JWT_SECRET_KEY);
  } catch (err) {
    return res.status(400).send({ errorMessage: err.message });
  }

  if (!authorization || !tokenDecoded || !tokenDecoded.id || !groupId || !userId || !roleType || !GROUP_ROLES.includes(roleType) ) {
    return res.status(400).json({
      status: "FAILED",
      message: "Empty input fields!",
    });
  }

  try {
    const records = await pool.query("SELECT * FROM `Group` WHERE `id` = ?", [groupId]);

    if (records.length < 1) {
      return res.json({
        status: "FAILED",
        message: "Group with the given id doesn't exists",
      });
    }
  } catch (err) {
    return res.status(400).send({ errorMessage: err.message });
  }

  try {
    const newGroupMember = {
      groupId,
      userId,
      roleType
    };

    await pool.query("INSERT INTO `Group_Member` set ?", [newGroupMember]);
  } catch (err) {
    return res.status(400).send({ errorMessage: err.message });
  }

  return res.status(200).json({
    status: "SUCCESS",
    message: "Group successfully deleted"
  });
});

// Send message to a group
router.post("/:groupId/message/create", async (req, res) => {
  const { authorization } = req.headers;
  const { groupId } = req.params;
  const { message } = req.body;

  let tokenDecoded;

  try {
    tokenDecoded = jwt.verify(authorization, JWT_SECRET_KEY);
  } catch (err) {
    return res.status(400).send({ errorMessage: err.message });
  }

  if (!authorization || !tokenDecoded || !tokenDecoded.id || !groupId || !message ) {
    return res.status(400).json({
      status: "FAILED",
      message: "Empty input fields!",
    });
  }

  const userId = tokenDecoded.id;

  try {
    const records = await pool.query("SELECT * FROM `Group_Member` WHERE `userId` = ? AND `groupId` = ?", [userId, groupId]);

    if (records.length < 1) {
      return res.json({
        status: "FAILED",
        message: "User is not a member of the group",
      });
    }

    const newMessage = {
      groupId,
      userId,
      messageText: message
    };

    await pool.query("INSERT INTO `Message` set ?", [newMessage])
  } catch (err) {
    return res.status(400).send({ errorMessage: err.message });
  }

  return res.status(200).end();
});

// React to a message
router.post("/:messageId/liked", async (req, res) => {
  const { authorization } = req.headers;
  const { messageId } = req.params;

  let tokenDecoded;

  try {
    tokenDecoded = jwt.verify(authorization, JWT_SECRET_KEY);
  } catch (err) {
    return res.status(400).send({ errorMessage: err.message });
  }

  if (!authorization || !tokenDecoded || !tokenDecoded.id || !messageId ) {
    return res.status(400).json({
      status: "FAILED",
      message: "Empty input fields!",
    });
  }

  const userId = tokenDecoded.id;

  try {
    const newReaction = {
      isLiked: 1,
      messageId,
      userId
    }
    await pool.query("INSERT INTO `Message_Liked` set ?", [newReaction])
  } catch (err) {
    return res.status(400).send({ errorMessage: err.message });
  }

  return res.status(200).end();
})

// Get messages in a group and groupInfo
router.get("/:groupId", async (req, res) => {
  const { authorization } = req.headers;
  const { groupId } = req.params;

  let tokenDecoded;
  let group = {};
  let groupAdmins = [];
  let groupMembers = [];
  let groupMessages = [];

  try {
    tokenDecoded = jwt.verify(authorization, JWT_SECRET_KEY);
  } catch (err) {
    return res.status(400).send({ errorMessage: err.message });
  }

  if (!authorization || !tokenDecoded || !tokenDecoded.id || !groupId) {
    return res.status(400).json({
      status: "FAILED",
      message: "Empty input fields!",
    });
  }

  const userId = tokenDecoded.id;

  try {
    const groupRecords = await pool.query("SELECT * FROM `Group` WHERE `id` = ?", [groupId]);

    if (groupRecords.length < 1 || groupRecords[0] || groupRecords[0].id) {
      return res.json({
        status: "FAILED",
        message: "Group does not exist",
      });
    }

    group = groupRecords[0];

    const records = await pool.query("SELECT * FROM `Group_Member` WHERE `groupId` = ?", [groupId]);

    if (records.length < 1) {
      return res.json({
        status: "FAILED",
        message: "Group doesn't not contain any users",
      });
    }

    let groupAdminsRecords = records.filter((groupMember) => groupMember.roleType === 'ADMIN').filter((groupMember) => groupMember.userId).map((groupMember) => groupMember.userId);
    let groupAdminsRecordsStr = `(${groupAdminsRecords})`;
    if (groupAdminsRecords.length) groupAdmins = await pool.query("SELECT * FROM `User` WHERE `id` IN ?", [groupAdminsRecordsStr]);

    let groupMembersRecords = records.filter((groupMember) => groupMember.roleType === 'MEMBER').filter((groupMember) => groupMember.userId).map((groupMember) => groupMember.userId);
    let groupMembersRecordsStr = `(${groupMembersRecords})`;
    if (groupMembersRecords.length) groupMembers = await pool.query("SELECT * FROM `User` WHERE `id` IN ?", [groupMembersRecordsStr]);

    let groupMessageRecords = await pool.query("SELECT * FROM `Message` WHERE `groupId` = ?", [groupId]);
    if (groupMessageRecords.length) groupMessages = groupMessageRecords;
  } catch (err) {
    return res.status(400).send({ errorMessage: err.message });
  }

  return res.status(200).send({
    groupInfo: group,
    groupAdmins,
    groupMembers,
    groupMessages
  });
});

// Get message info
router.get("/:messageId", async (req, res) => {
  const { authorization } = req.headers;
  const { messageId } = req.params;

  let tokenDecoded;
  let message;
  let likedUsers = [];

  try {
    tokenDecoded = jwt.verify(authorization, JWT_SECRET_KEY);
  } catch (err) {
    return res.status(400).send({ errorMessage: err.message });
  }

  if (!authorization || !tokenDecoded || !tokenDecoded.id || !messageId) {
    return res.status(400).json({
      status: "FAILED",
      message: "Empty input fields!",
    });
  }

  const userId = tokenDecoded.id;

  try {
    const messageRecords = await pool.query("SELECT * FROM `Message` WHERE `id` = ?", [messageId]);

    if (messageRecords.length < 1 || messageRecords[0] || messageRecords[0].id) {
      return res.json({
        status: "FAILED",
        message: "Message does not exist",
      });
    }

    message = messageRecords[0];

    let likedUserRecords = await pool.query("SELECT * FROM `Message_Liked` WHERE `isLiked` = ? and `messageId` = ?", [1, messageId]);
    likedUserRecords = likedUserRecords.filter((msg) => msg.userId).map((msg) => msg.userId);

    if (likedUserRecords.length) {
      let likedUserRecordsStr = `(${likedUserRecords})`;
      likedUsers = await pool.query("SELECT * FROM `User` WHERE `id` IN ?", [likedUserRecordsStr]);
    }
  } catch (err) {
    return res.status(400).send({ errorMessage: err.message });
  }

  return res.status(200).send({
    messageInfo: message,
    likedUsers
  });
});

module.exports = router;