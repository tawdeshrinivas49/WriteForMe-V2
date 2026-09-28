const MatchingService = require('./matching.service');
const prisma = require('../../config/database');

exports.findVolunteers = async (req, res) => {
  try {
    const { requestId } = req.params;
    const radiusKm = parseFloat(req.query.radiusKm) || 10;
    const results = await MatchingService.findVolunteersForRequest(requestId, radiusKm);
    res.status(200).json({
      success: true,
      requestId,
      searchRadiusKm: radiusKm,
      totalMatched: results.volunteers.length,
      transportStrategy: results.transportStrategy,
      data: results.volunteers
    });
  } catch (error) {
    console.error('Find Volunteers Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.assignVolunteer = async (req, res) => {
  try {
    const { requestId, volunteerId, userId } = req.body;

    // If volunteerId not provided, try to find it using userId
    let finalVolunteerId = volunteerId;
    if (!finalVolunteerId && userId) {
      const volunteer = await prisma.volunteerProfile.findUnique({
        where: { userId: userId },
      });
      if (!volunteer) {
        return res.status(400).json({ error: 'Volunteer profile not found for this user.' });
      }
      finalVolunteerId = volunteer.id;
    }

    if (!requestId || !finalVolunteerId) {
      return res.status(400).json({ error: 'requestId and either volunteerId or userId are required.' });
    }

    const updatedRequest = await MatchingService.assignVolunteerToRequest(requestId, finalVolunteerId);
    res.status(200).json({
      message: 'Scribe successfully assigned to exam request!',
      data: updatedRequest
    });
  } catch (error) {
    console.error('Assign Volunteer Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ✅ NEW: Get eligible requests for a volunteer (using matching service filters)
exports.getEligibleRequests = async (req, res) => {
  try {

    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Authentication required.' });
    }
    const userId = req.user.id;
    // Fetch volunteer profile using userId
    const volunteer = await prisma.volunteerProfile.findUnique({
      where: { userId: userId }
    });
    if (!volunteer) {
      return res.status(400).json({ error: 'Volunteer profile not found for this user.' });
    }
    const volunteerId = volunteer.id;
    const radiusKm = parseFloat(req.query.radiusKm) || 10;
    const results = await MatchingService.findEligibleRequestsForVolunteer(volunteerId, radiusKm);
    res.status(200).json({
      success: true,
      total: results.length,
      data: results,
    });
  } catch (error) {
    console.error('Get Eligible Requests Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};