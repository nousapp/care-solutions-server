require('dotenv').config();
const shortid = require('shortid');
const format = require('pg-format');
const db = require('mssql');
// Helpers for Authentication


/**
 * userExists
 * @description: Checks if the username already exists in the database
 * @param {string} username
 */
async function userExists(username) {
  try {
    // MSSQL METHOD
    // Initiate Request
    const pool = await db.connect(`${process.env.DATABASE_URL}`);
    let reqPool = await pool.request() 
    // Handle Query Values
    reqPool.input(0, username);
    // Handle Format String
    const formattedSelect = format(
      `SELECT user_id FROM dbo.users WHERE user_id = @0`
    );
    // Pass in Query
    let result = await reqPool.query(formattedSelect);
    db.close();
    return result.recordset.length !== 0;
  } catch (err) {
    db.close();
    throw err;
  }
}

/**
 * createUser
 * @description Stores user data in the database
 * @param {string} username
 * @param {string} password
 * @param {string} salt
 * @param {string} firstName
 * @param {string} lastName
 * @param {string} role
 */
async function createUser(Username, Password, Salt, FirstName, LastName, Role) {
  try {
    // Checks if all inputs are in request
    if(!Username || !Password || !Salt || !FirstName || !LastName || !Role){
      throw new ErrorWithHttpStatus('Missing Properties', 400);
    }
    const pool = await db.connect(`${process.env.DATABASE_URL}`);
    let idInput = shortid.generate();
    let dateRequest = await pool.request().query('SELECT getdate();'); 
    // Destructure date
    let dateInput =  Object.values(dateRequest.recordset[0])[0];
    let SortName = `${LastName}, ${FirstName}`;

    // Create Transaction 
    await pool.request()
      .input('id', db.NVarChar(100), idInput)
      .input('createTime', dateInput)
      .input('user_id', db.NVarChar(100), Username)
      .input('password', db.NVarChar(100), Password)
      // Salt taken out because there is no hashed password
      //.input('salt', db.NVarChar(100), Salt)
      .input('firstName', db.NVarChar(100), FirstName)
      .input('lastName', db.NVarChar(100), LastName)
      .input('sortName', db.NVarChar(100), SortName)
      .input('role', db.NVarChar(100), Role)
      .query(`INSERT INTO dbo.users (id, created_date, updated_date, user_id, password, firstname, lastname, sortname, role) VALUES (@id, @createTime, @createTime, @user_id, @password, @firstName, @lastName, @sortName, @role);`);
      //// Query with salt
      //.query(`INSERT INTO dbo.users (id, created_date, updated_date, user_id, password, salt, firstname, lastname, sortname, role) VALUES (@id, @createTime, @createTime, @user_id, @password, @salt, @firstName, @lastName, @sortName, @role);`);
    
    // Get created Transaction
    let result = await pool.request()
      .input('id', db.NVarChar(100), idInput)
      .query( `SELECT * FROM dbo.users WHERE id = @id`);
    
    db.close();
    return result.recordset;
  } catch (err) {
    db.close();
    throw err;
  }
}

/**
 * storeToken
 * @description Stores token in the user's database
 * @param {string} id The stored id in the JWT that corresponds with a user.
 * @param {string} token
 */
async function storeToken(id, Token) {
  try {
    const pool = await db.connect(`${process.env.DATABASE_URL}`);
    // Get Time
    let dateRequest = await pool.request().query('SELECT getdate();'); 
    // Destructure date
    let dateInput =  Object.values(dateRequest.recordset[0])[0];

    // Update Data
    let reqPool = await pool.request() 
    // Handle Update Time Input
    reqPool.input('updateTime', dateInput);
    reqPool.input('token', Token);
    reqPool.input('id', db.NVarChar(100), id);
    var queryText = `UPDATE dbo.users SET updated_date = @updateTime, token = @Token WHERE id = @id;`;
    
    await reqPool.query(queryText);
    // Get updated Transaction
    let result = await pool.request()
      .input('id', db.NVarChar(100), id)
      .query( `SELECT * FROM dbo.transactions WHERE id = @id`);

    db.close();
    return result.recordset;
  } catch (err) {
    db.close();
    throw err;
  }
}

/**
 * Gets a user with an username INCLUDING salt and password
 * @description Gets all of a user's data.
 * @param {string} username
 * @returns {object} An object containing hash and salt
 */
async function getUserPrivate(username) {
  try {
    // MSSQL METHOD
    // Initiate Request
    const pool = await db.connect(`${process.env.DATABASE_URL}`);
    let reqPool = await pool.request() 
    // Handle Query Values
    reqPool.input(0, username);
    // Handle Format String
    const formattedSelect = format(
      `SELECT id, user_id, salt, password FROM dbo.users WHERE user_id = @0`
    );
    // Pass in Query
    let result = await reqPool.query(formattedSelect);
    db.close();
    return result.recordset[0];
  } catch (err) {
    db.close();
    if (err instanceof ErrorWithHttpStatus) throw err;
    else throw new ErrorWithHttpStatus('Database Error', 500);
  }
}


/**
 * Gets a user with an username INCLUDING password
 * @description Gets all of a user's data.
 * @param {string} username
 * @returns {object} An object containing hash and salt
 */
async function getUserPrivateNoSalt(username) {
  try {
    // MSSQL METHOD
    // Initiate Request
    const pool = await db.connect(`${process.env.DATABASE_URL}`);
    let reqPool = await pool.request() 
    // Handle Query Values
    reqPool.input(0, username);
    // Handle Format String
    const formattedSelect = format(
      `SELECT id, user_id, password FROM dbo.users WHERE user_id = @0`
    );
    // Pass in Query
    let result = await reqPool.query(formattedSelect);
    db.close();
    return result.recordset[0];
  } catch (err) {
    db.close();
    if (err instanceof ErrorWithHttpStatus) throw err;
    else throw new ErrorWithHttpStatus('Database Error', 500);
  }
}


module.exports = { userExists, createUser, storeToken, getUserPrivate, getUserPrivateNoSalt };
