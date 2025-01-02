const express = require('express');
const elBillrouter = express.Router();
const billController = require('../controllers/elBillPayControllers');
const auth = require("../middlewares/authenticat")

// Fetch Bill
elBillrouter.post('/fetchBill', billController.fetchBill);

// Validate Bill
elBillrouter.post('/validateBill', billController.validateBill);

// Pay Bill
elBillrouter.post('/payBill', auth, billController.paybill);

module.exports = elBillrouter;
