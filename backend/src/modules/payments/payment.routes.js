const express = require('express');
const router = express.Router();
const paymentController = require('./payment.controller');
const { authenticate, authorize } = require('../../middlewares/authMiddleware');

// All routes require authentication
router.use(authenticate);

// Student routes
router.post('/create-order', paymentController.createEscrowOrder);
router.post('/verify-escrow', paymentController.verifyEscrow);

// Volunteer / System routes (payout after completion)
router.post('/release-payout', paymentController.releasePayout);

// Admin routes (add authorize('SUPER_ADMIN') later)
router.post('/refund', paymentController.refundEscrow);
router.post('/retry-payout', paymentController.retryPayout);
router.post('/check-timeouts', paymentController.checkTimeouts);

module.exports = router;