const express = require('express');
const {
  createResident,
  updateResident,
  deleteResidentById,
  getResidents,
} = require('../controllers/Resident.controller');
const {
  createTransaction,
  updateTransaction,
  deleteTransactionById,
  getTransactions,
  getRecentTransactions,
} = require('../controllers/Transaction.controller');
const {
  createService,
  updateService,
  deleteServiceById,
  getServices,
} = require('../controllers/Service.controller');
const {
  registerUser,
  loginUser,
  updateUser,
  deleteUserById,
  getUsers,
} = require('../controllers/User.controller');

const router = express.Router();

/* Care Server Routes*/
// Default routes
router.get('/', (req, res, next) => {
  res.send('Welcome to Care Solutions Server');
  next();
});

// GET /api/residents
router.post('/api/residents', createResident);
router.get('/api/residents', getResidents);
router.patch('/api/residents/:id', updateResident);
router.delete('/api/residents/:id', deleteResidentById);

// GET /api/transactions
router.post('/api/transactions', createTransaction);
router.get('/api/transactions', getTransactions);
router.get('/api/transactions/recent', getRecentTransactions);
router.patch('/api/transactions/:id', updateTransaction);
router.delete('/api/transactions/:id', deleteTransactionById);

// GET /api/services
router.post('/api/services', createService);
router.get('/api/services', getServices);
router.patch('/api/services/:id', updateService);
router.delete('/api/services/:id', deleteServiceById);

// GET /api/users
router.post('/api/users', registerUser);
router.post('/api/users/login', loginUser);
router.get('/api/users', getUsers);
router.patch('/api/users/:id', updateUser);
router.delete('/api/users/:id', deleteUserById);

module.exports = router;