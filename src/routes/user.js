const express = require("express");
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require("bcrypt");

require('dotenv').config();
const pool = require('../model/db').pool;

const GENDERS = ['MALE', 'FEMALE', 'OTHER', 'NA'];
const JWT_EXPIRY = 3600 * 24;      // 1 day
const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY || 'kjfksfsdjflkdsjflkjsdlfkjhsdlkfj@#*(&@*!^#&@gfdsfdsf';

// let data = require('./data');
let jwtList = [];

// Signup
router.post("/signup", async (req, res) => {
  const { userName, firstName, lastName, gender } = req.body;

  if (!userName || !firstName || !req.body.password || !gender ) {
    return res.status(400).json({
      status: "FAILED",
      message: "Empty input fields!",
    });
  }

  if (req.body.password.length < 8) {
    return res.status(400).json({
      status: "FAILED",
      message: "Password is too short!",
    });
  }

  let hashedPassword = '';
  try {
    hashedPassword = await bcrypt.hash(req.body.password, 10);
  } catch(err) {
    return res.status(400).json({
      status: "FAILED",
      message: "Please try again!",
      errorMessage: err.message
    });
  }
  delete req.body.password;

  if (!GENDERS.includes(gender)) {
    return res.status(400).json({
      status: "FAILED",
      message: "Please select one of the given options",
    });
  }

  try {
    const records = await pool.query("SELECT * FROM User WHERE userName = ?", [userName]);

    if (records.length) {
      return res.json({
        status: "FAILED",
        message: "User with the given userName already exists",
      });
    }
  } catch (err) {
    return res.status(400).send({ errorMessage: err.message });
  }

  let result;
  try {
    const newUser = {
      userName,
      password: hashedPassword,
      firstName,
      lastName,
      gender
    };

    await pool.query("INSERT INTO User set ?", [newUser]);

    result = await pool.query("SELECT * FROM User WHERE userName = ?", [newUser.userName]);

    if (result.length < 1) {
      return res.status(400).send({ errorMessage: "Error while inserting the record, please try again" });
    } else {
      result = result[0];
    }
  } catch (err) {
    return res.status(400).send({ errorMessage: err.message });
  }

  result.password = null;
  let token;
  try {
    token = jwt.sign({
      id: result.id,
      userName: result.userName
    }, JWT_SECRET_KEY, { expiresIn: JWT_EXPIRY});
  } catch(err) {
    return res.status(400).json({
      status: "FAILED",
      message: "Please try again!",
      errorMessage: err.message
    });
  }

  jwtList.push(token);

  return res.status(201).json({
    status: "SUCCESS",
    message: "Signup successful",
    autorizationToken: token
  });
});

// Login
router.post("/login", async (req, res) => {
  const { userName, password } = req.body;
  let record;

  if (!userName || !password ) {
    return res.status(400).json({
      status: "FAILED",
      message: "Provide all the credentials!",
    });
  }

  if (password.length < 8) {
    return res.status(400).json({
      status: "FAILED",
      message: "Password is too short!",
    });
  }

  let isAuthorised = false;
  try {
    record = await pool.query("SELECT * FROM User WHERE userName = ?", [userName]);
    if (record.length < 1) {
      return res.status(400).json({
        status: "FAILED",
        message: "User doesn't exists",
      });
    }

    isAuthorised = await bcrypt.compare(password, record[0].password);
  } catch(err) {
    return res.status(400).json({
      status: "FAILED",
      message: "Please try again!",
      errorMessage: err.message
    });
  }

  record[0].password = null;
  let token;
  try {
    token = jwt.sign({
      id: record[0].id,
      userName: record[0].userName
    }, JWT_SECRET_KEY, { expiresIn: JWT_EXPIRY });
  } catch(err) {
    return res.status(400).json({
      status: "FAILED",
      message: "Please try again!",
      errorMessage: err.message
    });
  }

  jwtList.push(token);

  if (isAuthorised) {
    return res.json({
      status: "SUCCESS",
      message: "Logged in successful",
      autorizationToken: token
    });
  }

  return res.status(400).json({
    status: "FAILED",
    message: "Please provide valid credentials"
  });
});

// Logout
router.get("/logout", async (req, res) => {
  const { authorization } = req.headers;
  const tokenDecoded = jwt.verify(authorization, JWT_SECRET_KEY);

  if (!authorization || !tokenDecoded || !tokenDecoded.id || !jwtList.includes(authorization)) {
    return res.status(400).json({
      status: "FAILED",
      message: "Unautorized user",
    });
  }

  jwtList = jwtList.filter((tok) => tok != authorization);

  return res.status(200).json({
    status: "SUCCESS",
    message: "User is successfully logged out"
  });
});

module.exports = router;
