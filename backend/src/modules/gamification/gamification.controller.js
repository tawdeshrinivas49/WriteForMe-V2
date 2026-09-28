const GamificationService = require('./gamification.service');
const BADGES = require('./badges.config');

exports.getVolunteerProfile = async (req, res) => {
  try {
    const { volunteerId } = req.params;
    const profile = await GamificationService.getVolunteerGamificationProfile(volunteerId);

    res.status(200).json({
      success: true,
      data: profile
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.getLeaderboard = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const leaderboard = await GamificationService.getLeaderboard(limit);

    res.status(200).json({
      success: true,
      data: leaderboard
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.getAllBadges = (req, res) => {
  const badgeList = Object.values(BADGES).map(({ id, title, description, icon }) => ({
    id,
    title,
    description,
    icon
  }));

  res.status(200).json({
    success: true,
    data: badgeList
  });
};

exports.processExamEvent = async (req, res) => {
  try {
    const { volunteerId, rating, isEmergency, distanceKm } = req.body;

    if (!volunteerId) {
      return res.status(400).json({ success: false, error: 'volunteerId is required.' });
    }

    const result = await GamificationService.processExamEvent(volunteerId, {
      rating: rating ? parseFloat(rating) : 5,
      isEmergency: Boolean(isEmergency),
      distanceKm: distanceKm ? parseFloat(distanceKm) : 0
    });

    res.status(200).json({
      success: true,
      message: 'Gamification event processed successfully!',
      data: result
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};