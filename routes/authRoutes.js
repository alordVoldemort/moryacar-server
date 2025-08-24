const express = require('express');
const router = express.Router();
const authController = require('../controller/authController');

// POST /api/auth/login
router.post('/login', authController.login);

module.exports = router;
