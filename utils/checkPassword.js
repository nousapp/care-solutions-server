const bcrypt = require('bcryptjs');
const { getUserPrivate, getUserPrivateNoSalt } = require('../db/auth');
const ErrorWithHTTPStatus = require('./ErrorWithHttpStatus');
/**
 * Checks if password user passes in is the same as the one stored in the database
 * @param {string} username
 * @param {string} password
 * @returns {Object} User data
 */
async function checkPassword(username, password) {
  const foundUser = await getUserPrivateNoSalt(username); 
  if (foundUser.password !== password) {
    throw new ErrorWithHTTPStatus('Authentication failed', 400);
  }
  return foundUser;
}
/*
//Sercured check password
async function checkPassword(username, password) {
  const foundUser = await getUserPrivate(username); 
  if (!foundUser.salt) {
    throw new ErrorWithHTTPStatus('No salt', 400);
  }
  const hashedPassword = await bcrypt.hash(password, foundUser.salt);
  if (foundUser.password !== hashedPassword) {
    throw new ErrorWithHTTPStatus('Authentication failed', 400);
  }
  return foundUser;
}
*/
module.exports = checkPassword;
