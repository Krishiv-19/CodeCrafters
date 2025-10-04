const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Authentication Dashboard Endpoints
router.post('/login', authController.loginUser);
router.post('/signup', authController.signupUser); // Used for initial setup

module.exports = router;