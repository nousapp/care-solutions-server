require('dotenv').config();
const shortid = require('shortid');
const format = require('pg-format');
const ErrorWithHttpStatus = require('../utils/ErrorWithHttpStatus');
// const db = require('../db/index')
const db = require('mssql');


/**
 * @typedef {Object} Service
 * @property {string} acl
 * @property {string} ServiceCode
 * @property {string} ServiceName
 */ 


/* Create */
/**
 * Inserts a new Service into the db
 * @param {Service} newService - the data to create the Service with
 * @returns {Promise<Service>} the created Service
 */
exports.insert = async ({ServiceCode, ServiceName }) => {
  try {
    // Checks if all inputs are in request
    if(!ServiceCode || !ServiceName){
      throw new ErrorWithHttpStatus('Missing Properties', 400);
    }
    const pool = await db.connect(`${process.env.DATABASE_URL}`);
    let idInput = shortid.generate();
    let dateRequest = await pool.request().query('SELECT getdate();'); 
    // Destructure date
    let dateInput =  Object.values(dateRequest.recordset[0])[0];

    // Create Service
    await pool.request()
      .input('id', db.NVarChar(100), idInput)
      .input('createTime', dateInput)
      .input('serviceCode', db.NVarChar(100), ServiceCode)
      .input('serviceName', db.NVarChar(100), ServiceName)
      .query(`INSERT INTO dbo.service (_id, _createdAt, _updatedAt, ServiceCode, ServiceName) VALUES (@id, @createTime, @createTime, @serviceCode, @serviceName);`);
    
    // Get created Service
    let result = await pool.request()
      .input('id', db.NVarChar(100), idInput)
      .query( `SELECT * FROM dbo.service WHERE _id = @id`);
    
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
 * Selects services from db.
 * Can accept optional query object to filter results.
 * Otherwise returns all services
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
      `SELECT * FROM dbo.service ${clauses.length ? `WHERE ${clauses}` : ''}`,
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
 *  Updates a Service
 * @param {string} id - id of the Service to update
 * @param {Service} newData - subset of values to update
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

    var queryText = `UPDATE dbo.service SET ` + params.join(', ') + ` WHERE _id = @id;`;
    
    await reqPool.query(queryText);

    // Get updated Service
    let result = await pool.request()
      .input('id', db.NVarChar(100), id)
      .query( `SELECT * FROM dbo.service WHERE _id = @id`);

    db.close();
    return result.recordset;
  } catch(err) {
    db.close()
    if (err instanceof ErrorWithHttpStatus) throw err;
    else throw new ErrorWithHttpStatus('Database Error', 500);
  }
};


/**
 *  Deletes a Service
 * @param {string} id - id of the Service to delete
 * @returns {Promise<void>}
 */
// TODO: Add error handler
exports.delete = async id => {
  try {
    const pool = await db.connect(`${process.env.DATABASE_URL}`);

    // Get created Service
    let result = await pool.request()
      .input('id', db.NVarChar(100), id)
      .query( `SELECT * FROM dbo.service WHERE _id = @id`);
    
    if (result.recordset.length == 0) {
      throw new ErrorWithHttpStatus('ID Does not exist', 400);
    }
    await pool.request()
      .input('id', db.NVarChar(100), id)
      .query(`DELETE FROM dbo.service WHERE _id = @id`);
    db.close(); 
    return result.recordset[0];
  } catch (err) {
    db.close();
    if (err instanceof ErrorWithHttpStatus) throw err;
    else throw new ErrorWithHttpStatus('Database Error', 500);
  }
};