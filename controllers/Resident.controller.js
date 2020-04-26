const validate = require('validate.js');
const Resident = require('../models/Resident.model');
const { wildcardConstraints } = require('../validations/residentValidations');
const ErrorWithHttpStatus = require('../utils/ErrorWithHttpStatus');

// Create
exports.createResident = async (req, res, next) => {
  try {
    const newResident = await Resident.insert(req.body);
    res.status(201).send(newResident);
  } catch (err) {
    next(err);
  }
};

// Read
exports.getResidents = async ({ query }, res, next) => {
  try {
    // 1. Check for wildcard
    if(query.wildcard){
      // Validate wildcard
      const result = validate({wildcard: query.wildcard}, wildcardConstraints)
      if (result !== undefined){
        throw new ErrorWithHttpStatus('Invalid data received.', 400);
      }
    }
    // 2. Get data from Residents model
    const residents = await Resident.select(query);
    // 3. send that out
    res.send(residents);
  } catch (err) {
    next(err);
  }
};

// Update
exports.updateResident = async (req, res, next) => {
  try {
    const { id } = req.params;
    const residents = await Resident.update(id, req.body);
    res.send(residents);
  } catch (err) {
    next(err);
  }
};

// Delete
exports.deleteResidentById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const residents = await Resident.delete(id);
    res.send(residents);
  } catch (err) {
    next(err);
  }
};
