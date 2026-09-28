const express = require('express');
const router = express.Router();
const gamificationController = require('./gamification.controller');

// GET /api/v1/gamification/profile/:volunteerId
router.get('/profile/:volunteerId', gamificationController.getVolunteerProfile);

// GET /api/v1/gamification/leaderboard?limit=10
router.get('/leaderboard', gamificationController.getLeaderboard);

// GET /api/v1/gamification/badges
router.get('/badges', gamificationController.getAllBadges);

// POST /api/v1/gamification/process-event
router.post('/process-event', gamificationController.processExamEvent);

module.exports = router;