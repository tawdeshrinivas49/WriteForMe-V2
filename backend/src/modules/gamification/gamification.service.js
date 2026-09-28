const prisma = require('../../config/database');
const BADGES = require('./badges.config');

const LEVELS = [
  { level: 1, title: 'Novice Scribe', minXp: 0, maxXp: 299 },
  { level: 2, title: 'Reliable Scribe', minXp: 300, maxXp: 799 },
  { level: 3, title: 'Expert Scribe', minXp: 800, maxXp: 1499 },
  { level: 4, title: 'Master Scribe', minXp: 1500, maxXp: 2999 },
  { level: 5, title: 'Legend Scribe', minXp: 3000, maxXp: Infinity }
];

class GamificationService {
  /**
   * Calculates dynamic level, title, and progress percentage based on total XP
   */
  static getLevelInfo(xpPoints = 0) {
    const currentTier = LEVELS.find(l => xpPoints >= l.minXp && xpPoints <= l.maxXp) || LEVELS[LEVELS.length - 1];
    const nextTier = LEVELS.find(l => l.level === currentTier.level + 1);

    let progressPercent = 100;
    let xpToNextLevel = 0;

    if (nextTier) {
      const xpInCurrentTier = xpPoints - currentTier.minXp;
      const tierTotalXp = nextTier.minXp - currentTier.minXp;
      progressPercent = Math.min(100, Math.floor((xpInCurrentTier / tierTotalXp) * 100));
      xpToNextLevel = nextTier.minXp - xpPoints;
    }

    return {
      level: currentTier.level,
      title: currentTier.title,
      currentXp: xpPoints,
      progressPercent,
      xpToNextLevel
    };
  }

  /**
   * Calculates XP breakdown for an exam event
   */
  static calculateExamXp(eventData = {}) {
    const { rating = 5, isEmergency = false, distanceKm = 0 } = eventData;

    let baseBonus = 100;
    let ratingBonus = rating === 5 ? 50 : rating >= 4 ? 25 : 0;
    let emergencyBonus = isEmergency ? 75 : 0;
    let distanceBonus = distanceKm > 10 ? 50 : 0;

    const totalEarnedXp = baseBonus + ratingBonus + emergencyBonus + distanceBonus;

    return {
      totalEarnedXp,
      breakdown: {
        baseXp: baseBonus,
        ratingBonus,
        emergencyBonus,
        distanceBonus
      }
    };
  }

  /**
   * Process exam completion, award XP, update level & check unlocked badges
   */
  static async processExamEvent(volunteerId, eventData = {}) {
    const volunteer = await prisma.volunteerProfile.findUnique({
      where: { id: volunteerId },
      include: { user: true }
    });

    if (!volunteer) {
      throw new Error(`Volunteer profile with ID ${volunteerId} not found.`);
    }

    // 1. Calculate XP Earned
    const xpResult = this.calculateExamXp(eventData);

    // 2. Compute updated stats
    const updatedTotalExams = (volunteer.totalExams || 0) + 1;
    const updatedXp = (volunteer.xpPoints || 0) + xpResult.totalEarnedXp;
    
    // Recalculate average rating if new rating provided
    let newAverageRating = volunteer.averageRating || 5.0;
    if (eventData.rating) {
      const currentSum = (volunteer.averageRating || 5.0) * (volunteer.totalExams || 0);
      newAverageRating = Number(((currentSum + eventData.rating) / updatedTotalExams).toFixed(2));
    }

    // 3. Update Database
    await prisma.volunteerProfile.update({
      where: { id: volunteerId },
      data: {
        totalExams: updatedTotalExams,
        xpPoints: updatedXp,
        averageRating: newAverageRating
      }
    });

    // 4. Evaluate Unlocked Badges
    const statsForBadgeCheck = {
      totalExams: updatedTotalExams,
      averageRating: newAverageRating,
      xpPoints: updatedXp
    };

    const newlyUnlockedBadges = [];
    Object.values(BADGES).forEach((badge) => {
      if (badge.condition(statsForBadgeCheck, eventData)) {
        newlyUnlockedBadges.push({
          id: badge.id,
          title: badge.title,
          description: badge.description,
          icon: badge.icon
        });
      }
    });

    const levelInfo = this.getLevelInfo(updatedXp);

    return {
      volunteerId: volunteer.id,
      phone: volunteer.user?.phone,
      xpAwarded: xpResult,
      levelInfo,
      unlockedBadges: newlyUnlockedBadges
    };
  }

  /**
   * Fetch complete gamification profile for a volunteer
   */
  static async getVolunteerGamificationProfile(volunteerId) {
    const volunteer = await prisma.volunteerProfile.findUnique({
      where: { id: volunteerId },
      include: { user: true }
    });

    if (!volunteer) {
      throw new Error(`Volunteer profile with ID ${volunteerId} not found.`);
    }

    const levelInfo = this.getLevelInfo(volunteer.xpPoints || 0);

    // Evaluate badges
    const stats = {
      totalExams: volunteer.totalExams || 0,
      averageRating: volunteer.averageRating || 5.0,
      xpPoints: volunteer.xpPoints || 0
    };

    const allBadges = Object.values(BADGES).map((badge) => ({
      id: badge.id,
      title: badge.title,
      description: badge.description,
      icon: badge.icon,
      isUnlocked: badge.condition(stats, {})
    }));

    return {
      volunteerId: volunteer.id,
      phone: volunteer.user?.phone,
      totalExams: volunteer.totalExams || 0,
      averageRating: volunteer.averageRating || 5.0,
      levelInfo,
      badges: allBadges
    };
  }

  /**
   * Fetch City / Global Leaderboard
   */
  static async getLeaderboard(limit = 10) {
    const topVolunteers = await prisma.volunteerProfile.findMany({
      take: parseInt(limit, 10),
      orderBy: [
        { xpPoints: 'desc' },
        { totalExams: 'desc' }
      ],
      include: {
        user: {
          select: {
            id: true,
            phone: true,
            profileImageUrl: true
          }
        }
      }
    });

    return topVolunteers.map((vol, index) => {
      const levelInfo = this.getLevelInfo(vol.xpPoints || 0);
      return {
        rank: index + 1,
        volunteerId: vol.id,
        phone: vol.user?.phone || 'N/A',
        profileImageUrl: vol.user?.profileImageUrl || null,
        xpPoints: vol.xpPoints || 0,
        totalExams: vol.totalExams || 0,
        averageRating: vol.averageRating || 5.0,
        level: levelInfo.level,
        title: levelInfo.title
      };
    });
  }
}

module.exports = GamificationService;