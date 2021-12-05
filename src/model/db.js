const mysql = require('mysql');
const promisify = require('util').promisify;

const dbconfig = require('../config/db.config');

// // Database setup
// const pool = mysql.createPool(dbconfig.connection);
// pool.getConnection(function(err, conn) {
//   conn.query('USE ' + dbconfig.database, function() {
//     conn.release();
//   });
// });

// // Returns a connection to the db
// const getConnection = function(callback) {
//   pool.getConnection(function(err, conn) {
//     callback(err, conn);
//   });
// };

// // Helper function for querying the db; releases the db connection
// // callback(err, rows)
// const query = function(queryString, params, callback) {
//   getConnection(function(err, conn) {
//     if (err) return callback(err);

//     conn.query(queryString, params, function(err, rows) {
//       conn.release();

//       if (err) return callback(err);

//       return callback(err, rows);
//     });
//   });
// };

// // Heartbeat function to keep the connection to the database up
// const keepAlive = function() {
//   getConnection(function(err, conn) {
//     if (err)
//       return;

//     conn.ping();
//     conn.release();
//   });
// };

// // Set up a keepalive heartbeat
// setInterval(keepAlive, 30000);

// exports.query = query;

const pool = mysql.createPool(dbconfig.connection);

pool.getConnection((err, connection) => {
  if (err) {
    if (err.code === "PROTOCOL_CONNECTION_LOST") {
      console.error("Database connection was closed.");
    }
    if (err.code === "ER_CON_COUNT_ERROR") {
      console.error("Database has to many connections");
    }
    if (err.code === "ECONNREFUSED") {
      console.error("Database connection was refused");
    }
  }

  if (connection) connection.release();
  console.log("DB is Connected");

  return;
});

// Promisify Pool Querys
pool.query = promisify(pool.query);

exports.pool = pool;