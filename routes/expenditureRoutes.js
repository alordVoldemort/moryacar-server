const express = require('express');
const router = express.Router();
const expenditureController = require('../controller/expenditureController');

// POST /api/expenditure/add
router.post('/add', expenditureController.addExpenditure);

// GET /api/expenditure/:car_id
router.get('/:car_id', expenditureController.getExpenditureByCarId);

module.exports = router;
