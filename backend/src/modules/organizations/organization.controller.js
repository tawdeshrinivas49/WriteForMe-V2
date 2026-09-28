const OrganizationService = require('./organization.service');

// POST /api/v1/organizations
exports.createOrganization = async (req, res) => {
  try {
    const { name, type, domain, reputationScore } = req.body;

    if (!name || !type) {
      return res.status(400).json({
        success: false,
        error: 'Name and type are required fields.'
      });
    }

    const organization = await OrganizationService.createOrganization({
      name,
      type,
      domain,
      reputationScore
    });

    res.status(201).json({
      success: true,
      message: 'Organization created successfully.',
      data: organization
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// GET /api/v1/organizations
exports.getAllOrganizations = async (req, res) => {
  try {
    const organizations = await OrganizationService.getAllOrganizations();

    res.status(200).json({
      success: true,
      data: organizations
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// GET /api/v1/organizations/domain/:domain
exports.getOrganizationByDomain = async (req, res) => {
  try {
    const { domain } = req.params;
    const organization = await OrganizationService.getOrganizationByDomain(domain);

    if (!organization) {
      return res.status(404).json({
        success: false,
        error: `No organization found matching domain '${domain}'.`
      });
    }

    res.status(200).json({
      success: true,
      data: organization
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// GET /api/v1/organizations/:id
exports.getOrganizationById = async (req, res) => {
  try {
    const { id } = req.params;
    const organization = await OrganizationService.getOrganizationById(id);

    res.status(200).json({
      success: true,
      data: organization
    });
  } catch (error) {
    res.status(404).json({ success: false, error: error.message });
  }
};

// POST /api/v1/organizations/assign-user
exports.assignUserToOrganization = async (req, res) => {
  try {
    const { userId, organizationId } = req.body;

    if (!userId || !organizationId) {
      return res.status(400).json({
        success: false,
        error: 'userId and organizationId are required.'
      });
    }

    const updatedUser = await OrganizationService.assignUserToOrganization(userId, organizationId);

    res.status(200).json({
      success: true,
      message: 'User successfully assigned to organization.',
      data: updatedUser
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// POST /api/v1/organizations/auto-assign-email
exports.assignUserByEmailDomain = async (req, res) => {
  try {
    const { userId, email } = req.body;

    if (!userId || !email) {
      return res.status(400).json({
        success: false,
        error: 'userId and email are required.'
      });
    }

    const result = await OrganizationService.assignUserByEmailDomain(userId, email);

    if (!result) {
      return res.status(200).json({
        success: true,
        message: 'No matching organization domain found for this email.',
        data: null
      });
    }

    res.status(200).json({
      success: true,
      message: 'User automatically linked to organization via email domain.',
      data: result
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// GET /api/v1/organizations/:id/metrics
exports.getOrganizationMetrics = async (req, res) => {
  try {
    const { id } = req.params;
    const metrics = await OrganizationService.getOrganizationMetrics(id);

    res.status(200).json({
      success: true,
      data: metrics
    });
  } catch (error) {
    res.status(404).json({ success: false, error: error.message });
  }
};

// POST /api/v1/organizations/cleanup-duplicates
exports.cleanupDuplicates = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Organization name is required for cleanup.'
      });
    }

    const result = await OrganizationService.removeDuplicateOrganizationsByName(name);

    res.status(200).json({
      success: true,
      message: `Cleanup completed. Merged and removed ${result.deletedCount} duplicate records.`,
      data: result
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};