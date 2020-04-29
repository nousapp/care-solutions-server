require('dotenv').config();
const shortid = require('shortid');
const format = require('pg-format');
const ErrorWithHttpStatus = require('../utils/ErrorWithHttpStatus');
// const db = require('../db/index')
const db = require('mssql');


/**
 * @typedef {Object} Transaction
 * @property {string} acl
 * @property {string} ServiceCode
 * @property {string} ServicedBy
 * @property {string} TransDate
 * @property {string} ResidentId
 */ 


/* Create */
/**
 * Inserts a new Transaction into the db
 * @param {Transaction} newTransaction - the data to create the Transaction with
 * @returns {Promise<Transaction>} the created Transaction
 */
exports.insert = async ({ServiceCode, ServicedBy, TransDate, ResidentId }) => {
  try {
    // Checks if all inputs are in request
    if(!ServiceCode || !ServicedBy || !TransDate || !ResidentId){
      throw new ErrorWithHttpStatus('Missing Properties', 400);
    }
    const pool = await db.connect(`${process.env.DATABASE_URL}`);
    let idInput = shortid.generate();
    let dateRequest = await pool.request().query('SELECT getdate();'); 
    // Destructure date
    let dateInput =  Object.values(dateRequest.recordset[0])[0];

    // Create Transaction
    await pool.request()
      .input('id', db.NVarChar(100), idInput)
      .input('createTime', dateInput)
      .input('transDate', db.NVarChar(100), TransDate)
      .input('serviceCode', db.NVarChar(100), ServiceCode)
      .input('servicedBy', db.NVarChar(100), ServicedBy)
      .input('resId', db.NVarChar(100), ResidentId)
      .query(`INSERT INTO dbo.transactions (id, created_date, updated_date, service_code, username, trans_date,  resident_id) VALUES (@id, @createTime, @createTime, @serviceCode, @servicedBy, @transDate, @resId);`);
    
    // Get created Transaction
    let result = await pool.request()
      .input('id', db.NVarChar(100), idInput)
      .query( `SELECT * FROM dbo.transactions WHERE id = @id`);
    
    db.close();
    return result.recordset;
  } catch (err) {
    db.close();
    if (err instanceof ErrorWithHttpStatus) throw err;
    else throw new ErrorWithHttpStatus('Database Error', 500);
  }
}; 

/* Read */
/**
 * Selects transactions from db.
 * Can accept optional query object to filter results.
 * Otherwise returns all transactions
 * @param {Object} {query}
 * @returns {Promise<Object[]>}
 */
// CODE FOR QUERIES
exports.select = async ( query = {} ) => {
  try {
    // MSSQL METHOD
    // Initiate Request
    const pool = await db.connect(`${process.env.DATABASE_URL}`);
    let reqPool = await pool.request() 
    // Handle Query Values
    Object.values(query).forEach(async (value, index) => {
      reqPool.input(index, value);
    })
    // Handle Query Keys
    const clauses = Object.keys(query)
      .map((key,i) => `%I = @${i}`)
      .join(' AND ');
    // Handle Format String
    const formattedSelect = format(
      `SELECT TOP 1500 * FROM dbo.transactions ${clauses.length ? `WHERE ${clauses}` : ''} ORDER BY trans_date DESC`,
      ...Object.keys(query)  
    );
    // Pass in Query
    let result = await reqPool.query(formattedSelect);
    db.close();
    return result.recordset;
  } catch (err) {
    db.close();
    if (err instanceof ErrorWithHttpStatus) throw err;
    else throw new ErrorWithHttpStatus('Database Error', 500);
  }
};


/**
 *  Updates a Transaction
 * @param {string} id - id of the Transaction to update
 * @param {Transaction} newData - subset of values to update
 * @returns {Promise<void>}
 */
exports.update = async (id, newData) => {
  try {
    const pool = await db.connect(`${process.env.DATABASE_URL}`);
    // Get Time
    let dateRequest = await pool.request().query('SELECT getdate();'); 
    // Destructure date
    let dateInput =  Object.values(dateRequest.recordset[0])[0];

    // Update Data
    let reqPool = await pool.request() 
    var keys = Object.keys(newData);
    var values = Object.values(newData);
    // Handle Data coming in
    if (keys.length == 0) {
      throw new ErrorWithHttpStatus('Data Required to Update', 400);
    }
    var params = [];
    // Handle Update Time Input
    reqPool.input('updateTime', dateInput);
    params.push(`_updatedAt = @updateTime`);
    // Handle inputs from body
    for(var i = 1; i <= keys.length ; i++) {
      params.push(keys[i-1] + ` = @` + (i));
      reqPool.input(i, values[i-1]);
    }
    // Handle ID input
    reqPool.input('id', db.NVarChar(100), id);

    var queryText = `UPDATE dbo.transactions SET ` + params.join(', ') + ` WHERE id = @id;`;
    
    await reqPool.query(queryText);

    // Get updated Transaction
    let result = await pool.request()
      .input('id', db.NVarChar(100), id)
      .query( `SELECT * FROM dbo.transactions WHERE id = @id`);

    db.close();
    return result.recordset;
  } catch(err) {
    db.close()
    if (err instanceof ErrorWithHttpStatus) throw err;
    else throw new ErrorWithHttpStatus('Database Error', 500);
  }
};


/**
 *  Deletes a Transaction
 * @param {string} id - id of the Transaction to delete
 * @returns {Promise<void>}
 */
// TODO: Add error handler
exports.delete = async id => {
  try {
    const pool = await db.connect(`${process.env.DATABASE_URL}`);

    // Get created Transaction
    let result = await pool.request()
      .input('id', db.NVarChar(100), id)
      .query( `SELECT * FROM dbo.transactions WHERE id = @id`);
    
    if (result.recordset.length == 0) {
      throw new ErrorWithHttpStatus('ID Does not exist', 400);
    }
    await pool.request()
      .input('id', db.NVarChar(100), id)
      .query(`DELETE FROM dbo.transactions WHERE id = @id`);
    db.close(); 
    return result.recordset[0];
  } catch (err) {
    db.close();
    if (err instanceof ErrorWithHttpStatus) throw err;
    else throw new ErrorWithHttpStatus('Database Error', 500);
  }
};