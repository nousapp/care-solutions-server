require('dotenv').config();
// const pg = require('pg');
const ErrorWithHttpStatus = require('../utils/ErrorWithHttpStatus');
const sql = require('mssql');


// pick variables from env
// const pool = new pg.Pool({
//   connectionString: process.env.DATABASE_URL,
// });
const pool = new sql.ConnectionPool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT
})

pool.connect(err => {
  if (err instanceof ErrorWithHttpStatus) throw err;
  else throw new ErrorWithHttpStatus('Database Error', 500);
})


module.exports = pool;