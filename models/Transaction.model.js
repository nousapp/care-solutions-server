require('dotenv').config();
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
exports.insert = async ({service_code, username, trans_date, resident_id }) => {
  try {
    // Checks if all inputs are in request
    if(!service_code || !username || !trans_date || !resident_id){
      throw new ErrorWithHttpStatus('Missing Properties', 400);
    }
    const pool = await db.connect(`${process.env.DATABASE_URL}`);
    // let idInput = shortid.generate();
    let dateRequest = await pool.request().query('SELECT getdate();'); 
    // Destructure date
    let dateInput =  Object.values(dateRequest.recordset[0])[0];

    // Create Transaction
    await pool.request()
      // .input('id', db.NVarChar(100), idInput)
      .input('createTime', dateInput)
      .input('transDate', db.NVarChar(100), trans_date)
      .input('serviceCode', db.NVarChar(100), service_code)
      .input('servicedBy', db.NVarChar(100), username)
      .input('resId', db.NVarChar(100), resident_id)
      .query(`INSERT INTO dbo.transactions ( created_date, service_code, username, trans_date,  resident_id) VALUES ( @createTime, @serviceCode, @servicedBy, @transDate, @resId);`);
    
    // Get created Transaction
    let result = await pool.request()
      .input('transDate', db.NVarChar(100), trans_date)
      .input('serviceCode', db.NVarChar(100), service_code)
      .input('servicedBy', db.NVarChar(100), username)
      .input('resId', db.NVarChar(100), resident_id)
      .query( `SELECT TOP 1 * FROM dbo.transactions WHERE trans_date = @transDate AND service_code = @serviceCode AND username = @servicedBy AND resident_id = @resId ORDER BY created_date DESC`);
    
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

/* Read Past 7 Days*/
/**
 * Selects transactions from db.
 * Can accept optional query object to filter results.
 * Otherwise returns all transactions
 * @param {Object} {query}
 * @returns {Promise<Object[]>}
 */
// CODE FOR QUERIES
exports.selectRecent = async ( query = {} ) => {
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
      `SELECT TOP 1500 * FROM dbo.transactions WHERE trans_date >= DateAdd(Day, DateDiff(Day, 0, GetDate()) - 7, 0) ${clauses.length ? `AND ${clauses}` : ''} ORDER BY trans_date DESC`,
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
    params.push(`updated_date = @updateTime`);
    // Handle inputs from body
    for(var i = 1; i <= keys.length ; i++) {
      // Handle Data coming in
      if (keys[i-1] == 'service_code' || keys[i-1] == 'username' || keys[i-1] == 'trans_date' || keys[i-1] == 'resident_id' ) {
        params.push(keys[i-1] + ` = @` + (i));
        reqPool.input(i, values[i-1]);
      } else {
        throw new ErrorWithHttpStatus('Invalid data', 400);
      }
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