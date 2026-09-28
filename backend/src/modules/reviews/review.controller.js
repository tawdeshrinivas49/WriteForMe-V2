const reviewService = require('./review.service');

// POST /api/v1/reviews/scribe
exports.createScribeReview = async (req, res) => {
  try {
    const { requestId, rating, comment, tags } = req.body;

    if (!requestId) {
      return res.status(400).json({ success: false, error: 'requestId is required.' });
    }

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, error: 'Rating must be an integer between 1 and 5.' });
    }

    const result = await reviewService.createScribeReview({ requestId, rating, comment, tags });

    res.status(201).json({
      success: true,
      message: 'Scribe review submitted successfully! Gamification stats updated.',
      data: result
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// POST /api/v1/reviews/platform
exports.createPlatformFeedback = async (req, res) => {
  try {
    const { userId, userRole, category, rating, feedbackText, appVersion, deviceInfo } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, error: 'userId is required.' });
    }

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, error: 'Rating must be between 1 and 5.' });
    }

    if (!feedbackText) {
      return res.status(400).json({ success: false, error: 'feedbackText cannot be empty.' });
    }

    const feedback = await reviewService.createPlatformFeedback({
      userId,
      userRole,
      category,
      rating,
      feedbackText,
      appVersion,
      deviceInfo
    });

    res.status(201).json({
      success: true,
      message: 'Platform feedback recorded successfully. Thank you!',
      data: feedback
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// GET /api/v1/reviews/volunteer/:volunteerId
exports.getVolunteerReviews = async (req, res) => {
  try {
    const { volunteerId } = req.params;
    const reviews = await reviewService.getVolunteerReviews(volunteerId);

    res.status(200).json({ success: true, data: reviews });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// GET /api/v1/reviews/request/:requestId
exports.getReviewByRequestId = async (req, res) => {
  try {
    const { requestId } = req.params;
    const review = await reviewService.getReviewByRequestId(requestId);

    if (!review) {
      return res.status(404).json({ success: false, error: 'No review found for this request.' });
    }

    res.status(200).json({ success: true, data: review });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// GET /api/v1/reviews/platform
exports.getPlatformFeedback = async (req, res) => {
  try {
    const { category, limit } = req.query;
    const feedbackList = await reviewService.getPlatformFeedback(category, limit);

    res.status(200).json({ success: true, data: feedbackList });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};