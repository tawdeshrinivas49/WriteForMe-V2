const express = require('express');
const router = express.Router();
const userController = require('./user.controller');
const { authenticate } = require('../../middlewares/authMiddleware');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// All routes require authentication
router.use(authenticate);

// Profile
router.get('/profile', userController.getProfile);

// Profile image upload
router.put('/profile-image', upload.single('profileImage'), userController.uploadProfileImage);

// Candidate profile update
router.put('/candidate-profile', userController.updateCandidateProfile);

// Volunteer profile update (includes UPI)
router.put('/volunteer-profile', userController.updateVolunteerProfile);

// Volunteer location
router.put('/location', userController.updateVolunteerLocation);

// Volunteer availability toggle
router.put('/toggle-availability', userController.toggleVolunteerAvailability);

// Dashboards
router.get('/dashboard/student', userController.getStudentDashboard);
router.get('/dashboard/volunteer', userController.getVolunteerDashboard);

module.exports = router;