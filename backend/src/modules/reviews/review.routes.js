const express = require('express');
const router = express.Router();
const reviewController = require('./review.controller');

// Student -> Scribe Review
router.post('/scribe', reviewController.createScribeReview);

// User -> Platform Feedback
router.post('/platform', reviewController.createPlatformFeedback);

// Read Endpoints
router.get('/volunteer/:volunteerId', reviewController.getVolunteerReviews);
router.get('/request/:requestId', reviewController.getReviewByRequestId);
router.get('/platform', reviewController.getPlatformFeedback);

module.exports = router;