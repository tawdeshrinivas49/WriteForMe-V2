const express = require('express');
const router = express.Router();
const organizationController = require('./organization.controller');
const { authenticate, authorize } = require('../../middlewares/authMiddleware');

// Public read
router.get('/', organizationController.getAllOrganizations);
router.get('/domain/:domain', organizationController.getOrganizationByDomain);
router.get('/:id', organizationController.getOrganizationById);

// Admin-protected organizational management
router.post('/', authenticate, authorize('SUPER_ADMIN', 'ORG_ADMIN'), organizationController.createOrganization);
router.post('/assign-user', authenticate, authorize('SUPER_ADMIN', 'ORG_ADMIN'), organizationController.assignUserToOrganization);
router.post('/auto-assign-email', authenticate, organizationController.assignUserByEmailDomain);
router.post('/cleanup-duplicates', authenticate, authorize('SUPER_ADMIN'), organizationController.cleanupDuplicates);
router.get('/:id/metrics', authenticate, authorize('SUPER_ADMIN', 'ORG_ADMIN'), organizationController.getOrganizationMetrics);

module.exports = router;