const express = require('express');
const router = express.Router();
const matchingController = require('./matching.controller');
const { authenticate } = require('../../middlewares/authMiddleware'); // ✅ Correct import

// Apply auth middleware to all routes in this router
router.use(authenticate);

// GET /api/v1/matching/find-volunteers/:requestId?radiusKm=10
// Finds nearby eligible scribes based on location, distance, transport needs, and gender constraints
router.get('/find-volunteers/:requestId', matchingController.findVolunteers);

// POST /api/v1/matching/assign
// Assigns/Matches a volunteer to an exam request
router.post('/assign', matchingController.assignVolunteer);

// ✅ NEW: Get eligible requests for a volunteer
router.get('/available-requests', matchingController.getEligibleRequests);

module.exports = router;