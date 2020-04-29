const Transaction = require('../models/Transaction.model');

// Create
exports.createTransaction = async (req, res, next) => {
  try {
    const newTransaction = await Transaction.insert(req.body);
    res.status(201).send(newTransaction);
  } catch (err) {
    next(err);
  }
};

// Read
exports.getTransactions = async ({ query }, res, next) => {
  try {
    // 1.get data from Transactions model
    const transactions = await Transaction.select(query);
    // 2. send that out
    res.send(transactions);
  } catch (err) {
    next(err);
  }
};

// Read Past 7 Days
exports.getRecentTransactions = async ({ query }, res, next) => {
  try {
    // 1.get data from Transactions model
    const transactions = await Transaction.selectRecent(query);
    // 2. send that out
    res.send(transactions);
  } catch (err) {
    next(err);
  }
};

// Update
exports.updateTransaction = async (req, res, next) => {
  try {
    const { id } = req.params;
    const transactions = await Transaction.update(id, req.body);
    res.send(transactions);
  } catch (err) {
    next(err);
  }
};

// Delete
exports.deleteTransactionById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const transactions = await Transaction.delete(id);
    res.send(transactions);
  } catch (err) {
    next(err);
  }
};
