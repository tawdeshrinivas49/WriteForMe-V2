const express = require('express');
const router = express.Router();
const authController = require('./auth.controller');

// Existing DigiLocker routes
router.get('/digilocker/initiate', authController.initiateDigiLocker);
router.get('/digilocker/callback', authController.digilockerCallback);

// NEW: Email/Password Signup & Login
router.post('/signup', authController.signup);
router.post('/login', authController.login);

// NEW: Google Login
router.post('/google', authController.googleLogin);

module.exports = router;