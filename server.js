require('dotenv').config();
const express = require('express');
const app = express();
const cors = require('cors');
const morgan = require("morgan");
const bodyParser = require('express').json;
const port = process.env.PORT || 8000;

const UserRouter = require('./src/routes/user');
// const GroupRouter = require('./src/routes/group');

app.use(morgan("common"));
app.use(cors());
app.use(bodyParser());

app.get("/", (req, res) => {
  return res.json({ message: "Hosting NodeJs backend successfull !!" });
});

app.get("/health-check", (req, res) => {
  return res.json({ status: "alive" });
});

app.use('/user', UserRouter);
// app.use('/group', GroupRouter);

app.listen(port, () => {
    console.log(`Listening on ${port}`);
    console.log(`PID: ${process.pid}`);
});