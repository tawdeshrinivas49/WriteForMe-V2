const express = require('express');
const router = express.Router();
const paymentController = require('./payment.controller');
const { authenticate } = require('../../middlewares/authMiddleware');

// All payment routes require authentication
router.use(authenticate);

// Student payment routes
router.post('/create-order', paymentController.createEscrowOrder);
router.post('/verify-escrow', paymentController.verifyEscrow);

// Payout route upon exam completion
router.post('/release-payout', paymentController.releasePayout);

// Admin and refund maintenance routes
router.post('/refund', paymentController.refundEscrow);
router.post('/retry-payout', paymentController.retryPayout);
router.post('/check-timeouts', paymentController.checkTimeouts);

module.exports = router;