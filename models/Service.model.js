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
exports.insert = async ({service_code, service_name }) => {
  try {
    // Checks if all inputs are in request
    if(!service_code || !service_name){
      throw new ErrorWithHttpStatus('Missing Properties', 400);
    }
    const pool = await db.connect(`${process.env.DATABASE_URL}`);
    let dateRequest = await pool.request().query('SELECT getdate();'); 
    // Destructure date
    let dateInput =  Object.values(dateRequest.recordset[0])[0];

    // Create Service
    await pool.request()
      .input('createTime', dateInput)
      .input('serviceCode', db.NVarChar(100), service_code)
      .input('serviceName', db.NVarChar(100), service_name)
      .query(`INSERT INTO dbo.services (created_date, service_code, service_name) VALUES ( @createTime, @serviceCode, @serviceName);`);
    
    // Get created Service
    let result = await pool.request()
      .input('serviceCode', db.NVarChar(100), service_code)
      .input('serviceName', db.NVarChar(100), service_name)
      .query( `SELECT TOP 1 * FROM dbo.services WHERE service_code = @serviceCode AND service_name = @serviceName ORDER BY created_date DESC`);
    
    
    db.close();
    return result.recordset;
  } catch (err) {
    db.close();
    console.log(err);
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
      `SELECT * FROM dbo.services ${clauses.length ? `WHERE ${clauses}` : ''}`,
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
    params.push(`updated_date = @updateTime`);
    // Handle inputs from body
    for(var i = 1; i <= keys.length ; i++) {
      // Checks Data coming in
      if (keys[i-1] == 'service_code' || keys[i-1] == 'service_name' ) {
        params.push(keys[i-1] + ` = @` + (i));
        reqPool.input(i, values[i-1]);
      } else {
        throw new ErrorWithHttpStatus('Invalid data', 400);
      }
    }
    // Handle ID input
    reqPool.input('id', db.NVarChar(100), id);

    var queryText = `UPDATE dbo.services SET ` + params.join(', ') + ` WHERE id = @id;`;
    
    await reqPool.query(queryText);

    // Get updated Service
    let result = await pool.request()
      .input('id', db.NVarChar(100), id)
      .query( `SELECT * FROM dbo.services WHERE id = @id`);

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
      .query( `SELECT * FROM dbo.services WHERE id = @id`);
    
    if (result.recordset.length == 0) {
      throw new ErrorWithHttpStatus('ID Does not exist', 400);
    }
    await pool.request()
      .input('id', db.NVarChar(100), id)
      .query(`DELETE FROM dbo.services WHERE id = @id`);
    db.close(); 
    return result.recordset[0];
  } catch (err) {
    db.close();
    if (err instanceof ErrorWithHttpStatus) throw err;
    else throw new ErrorWithHttpStatus('Database Error', 500);
  }
};