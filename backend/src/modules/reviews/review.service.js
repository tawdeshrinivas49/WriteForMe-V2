const prisma = require('../../config/database');


const GamificationService = require('../gamification/gamification.service');

class ReviewService {
  /**
   * 1. Submit Scribe Performance Review (Student -> Scribe)
   */
  static async createScribeReview(reviewData) {
    const { requestId, rating, comment, tags = [] } = reviewData;

    // Fetch Exam Request details
    const request = await prisma.examRequest.findUnique({
      where: { id: requestId },
      include: { volunteer: true, candidate: true }
    });

    if (!request) {
      throw new Error(`Exam request with ID ${requestId} not found.`);
    }

    if (request.status !== 'COMPLETED') {
      throw new Error(`Cannot submit review. Exam status is '${request.status}' — must be 'COMPLETED'.`);
    }

    if (!request.volunteerId) {
      throw new Error('Cannot submit review: No volunteer was assigned to this exam.');
    }

    const volunteerId = request.volunteerId;

    // Create review entry
    const createdReview = await prisma.scribeReview.create({
      data: {
        requestId,
        rating: parseInt(rating, 10),
        comment: comment || '',
        tags: Array.isArray(tags) ? tags.join(',') : tags || ''
      }
    });

    // Recalculate & Update Volunteer's averageRating and totalExams count
    const volunteerReviews = await this.getVolunteerReviews(volunteerId);
    const avgRating =
      volunteerReviews.reduce((acc, curr) => acc + curr.rating, 0) / volunteerReviews.length;

    await prisma.volunteerProfile.update({
      where: { id: volunteerId },
      data: {
        averageRating: parseFloat(avgRating.toFixed(2)),
        totalExams: { increment: 1 }
      }
    });

    // Trigger Gamification Engine (+XP, Level Up, Badge Check)
    const gamificationUpdate = await GamificationService.processExamEvent(volunteerId, {
      rating: parseInt(rating, 10),
      isEmergency: request.isEmergency || false
    });

    return {
      review: createdReview,
      gamificationUpdate
    };
  }

  /**
   * 2. Submit Platform Feedback (User -> Platform CSAT & Bugs)
   */
  static async createPlatformFeedback(feedbackData) {
    const { userId, userRole, category = 'GENERAL', rating, feedbackText, appVersion, deviceInfo } = feedbackData;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error(`User with ID ${userId} not found.`);
    }

    // Create Platform Feedback Entry
    const feedback = await prisma.platformFeedback.create({
      data: {
        userId,
        userRole: userRole || user.role || 'STUDENT',
        category, // APP_UX, MATCHING_SPEED, PAYMENTS_ESCROW, BUG_REPORT, GENERAL
        rating: parseInt(rating, 10),
        feedbackText,
        appVersion: appVersion || '1.0.0',
        deviceInfo: deviceInfo || 'Web Browser'
      }
    });

    return feedback;
  }

  /**
   * Fetch all reviews for a specific volunteer with candidate and exam context
   */
  static async getVolunteerReviews(volunteerId) {
    const requests = await prisma.examRequest.findMany({
      where: { volunteerId },
      select: { id: true }
    });

    const requestIds = requests.map((r) => r.id);

    return await prisma.scribeReview.findMany({
      where: {
        requestId: { in: requestIds }
      },
      include: {
        request: {
          select: {
            id: true,
            examName: true,
            examDate: true,
            candidate: {
              select: {
                user: {
                  select: { name: true }
                }
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Fetch review by exam request ID
   */
  static async getReviewByRequestId(requestId) {
    return await prisma.scribeReview.findFirst({
      where: { requestId }
    });
  }

  /**
   * Fetch Platform Feedback (Admin Dashboard view with optional category filter)
   */
  static async getPlatformFeedback(category = null, limit = 20) {
    const whereClause = category ? { category } : {};

    return await prisma.platformFeedback.findMany({
      where: whereClause,
      take: parseInt(limit, 10),
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            role: true
          }
        }
      }
    });
  }
}

module.exports = ReviewService;