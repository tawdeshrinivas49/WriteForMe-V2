const express = require('express');
const router = express.Router();
const requestsController = require('./request.controller');
// Use destructuring to get authenticate middleware
const { authenticate } = require('../../middlewares/authMiddleware');

// Apply authenticate middleware to all routes
router.use(authenticate);

router.post('/', requestsController.createRequest);
router.get('/', requestsController.getRequests);
router.get('/:id', requestsController.getRequestById);
router.post('/:id/verify-start-pin', requestsController.verifyStartPin);
router.post('/:id/verify-completion-pin', requestsController.verifyCompletionPin);

module.exports = router;