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
 * Inserts a new resident into the db
 * @param {Transaction} newTransaction - the data to create the Transaction with
 * @returns {Promise<Transaction>} the created Transaction
 */
exports.insert = async ({ServiceCode, ServicedBy, TransDate, ResidentId }) => {
  try {
    if(!ServiceCode || !ServicedBy || !TransDate || !ResidentId){
      throw new ErrorWithHttpStatus('Missing Properties', 400);
    }
    const pool = await db.connect(`${process.env.DATABASE_URL}`);
    let idInput = shortid.generate();
    let dateRequest = await pool.request().query('SELECT getdate();'); 
    // Destructure date
    let dateInput =  Object.values(dateRequest.recordset[0])[0];

    // Create Resident
    await pool.request()
      .input('id', db.NVarChar(100), idInput)
      .input('createTime', dateInput)
      .input('transDate', db.NVarChar(100), TransDate)
      .input('serviceCode', db.NVarChar(100), ServiceCode)
      .input('servicedBy', db.NVarChar(100), ServicedBy)
      .input('resId', db.NVarChar(100), ResidentId)
      .query(`INSERT INTO ${process.env.TRANSACTION_DB} (_id, _createdAt, _updatedAt, ServiceCode, ServicedBy, TransDate,  ResidentId) VALUES (@id, @createTime, @createTime, @serviceCode, @servicedBy, @transDate, @resId);`);
    
    // Get created Resident
    let result = await pool.request()
      .input('id', db.NVarChar(100), idInput)
      .query( `SELECT * FROM ${process.env.TRANSACTION_DB} WHERE _id = @id`);
    
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
 * Selects snippets from db.
 * Can accept optional query object to filter results.
 * Otherwise returns all snippets
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
      `SELECT * FROM ${process.env.TRANSACTION_DB} ${clauses.length ? `WHERE ${clauses}` : ''}`,
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
    return 'UPDATE Transaction';
  } catch(err) {
    db.close()
    console.log(err);
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
    return 'DELETE Transaction';
  } catch (err) {
    db.close();
    if (err instanceof ErrorWithHttpStatus) throw err;
    else throw new ErrorWithHttpStatus('Database Error', 500);
  }
};