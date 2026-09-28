const prisma = require('../../config/database');

class UserService {
  /**
   * 1. Get Logged-in User Profile with role-specific details
   */
  static async getUserProfile(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        candidateProfile: true,
        volunteerProfile: true,
        organization: {
          select: {
            id: true,
            name: true,
            type: true,
            reputationScore: true,
          },
        },
      },
    });

    if (!user) {
      throw new Error(`User with ID '${userId}' not found.`);
    }

    return user;
  }

  /**
   * 2. Upsert Candidate Profile Attributes
   */
  static async updateCandidateProfile(userId, data) {
    const { udidNumber, disabilityType, homeLat, homeLng } = data;

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error(`User with ID '${userId}' not found.`);
    }

    const parsedLat = homeLat ? parseFloat(homeLat) : undefined;
    const parsedLng = homeLng ? parseFloat(homeLng) : undefined;

    const candidateProfile = await prisma.candidateProfile.upsert({
      where: { userId },
      update: {
        udidNumber: udidNumber || undefined,
        disabilityType: disabilityType || undefined,
        homeLat: parsedLat,
        homeLng: parsedLng,
      },
      create: {
        userId,
        udidNumber: udidNumber || null,
        disabilityType: disabilityType || null,
        homeLat: parsedLat || null,
        homeLng: parsedLng || null,
      },
    });

    return candidateProfile;
  }

  /**
   * 3. Upsert Volunteer Profile Attributes
   */
  static async updateVolunteerProfile(userId, data) {
    const {
      upiId,
      hasVehicle,
      vehicleType,
      highestEducation,
      maxExamLevelAllowed,
      eduDocumentUrl,
    } = data;

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error(`User with ID '${userId}' not found.`);
    }

    const volunteerProfile = await prisma.volunteerProfile.upsert({
      where: { userId },
      update: {
        upiId: upiId || undefined,
        hasVehicle: typeof hasVehicle === 'boolean' ? hasVehicle : undefined,
        vehicleType: vehicleType || undefined,
        highestEducation: highestEducation || undefined,
        maxExamLevelAllowed: maxExamLevelAllowed || undefined,
        eduDocumentUrl: eduDocumentUrl || undefined,
      },
      create: {
        userId,
        upiId: upiId || null,
        hasVehicle: hasVehicle || false,
        vehicleType: vehicleType || 'NONE',
        highestEducation: highestEducation || null,
        maxExamLevelAllowed: maxExamLevelAllowed || 'SECONDARY',
        eduDocumentUrl: eduDocumentUrl || null,
      },
    });

    return volunteerProfile;
  }

  /**
   * 4. Update Volunteer Live Location Tracking
   */
  static async updateVolunteerLocation(userId, lastLat, lastLng) {
    if (lastLat === undefined || lastLng === undefined) {
      throw new Error('Both lastLat and lastLng are required for location updates.');
    }

    const volunteer = await prisma.volunteerProfile.findUnique({
      where: { userId },
    });

    if (!volunteer) {
      throw new Error(`Volunteer profile not found for user ID '${userId}'.`);
    }

    return await prisma.volunteerProfile.update({
      where: { userId },
      data: {
        lastLat: parseFloat(lastLat),
        lastLng: parseFloat(lastLng),
      },
    });
  }

  /**
   * 5. Toggle Volunteer Availability Status
   */
  static async toggleVolunteerAvailability(userId, isAvailable) {
    if (typeof isAvailable !== 'boolean') {
      throw new Error('isAvailable must be a boolean (true or false).');
    }

    const volunteer = await prisma.volunteerProfile.findUnique({
      where: { userId },
    });

    if (!volunteer) {
      throw new Error(`Volunteer profile not found for user ID '${userId}'.`);
    }

    return await prisma.volunteerProfile.update({
      where: { userId },
      data: { isAvailable },
    });
  }

  // ================================================================
  //  DASHBOARD METHODS (with payment status)
  // ================================================================

  /**
   * 6. Student Dashboard with payment status for each exam
   */
  static async getStudentDashboard(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { candidateProfile: true },
    });
    if (!user) throw new Error('User not found');
    if (!user.candidateProfile) {
      throw new Error('Candidate profile not found for this user');
    }

    // Fetch upcoming exams with payment
    const upcomingExams = await prisma.examRequest.findMany({
      where: {
        candidateId: user.candidateProfile.id,
        status: { notIn: ['CANCELLED', 'REFUNDED'] },
      },
      include: {
        volunteer: { include: { user: true } },
        payments: {
          where: { type: 'PLATFORM_FEE_INBOUND' },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { examDate: 'asc' },
    });

    // Enrich each exam with paymentStatus
    const enriched = upcomingExams.map((exam) => {
      const payment = exam.payments[0];
      let paymentStatus = 'UNPAID';
      if (['MATCHED', 'IN_PERSON_VERIFIED', 'IN_PROGRESS', 'COMPLETED', 'CREATED'].includes(exam.status)) {
        paymentStatus = 'PAID';
      } else if (payment) {
        if (payment.status === 'PENDING') paymentStatus = 'PENDING';
        else if (payment.status === 'ESCROWED' || payment.status === 'CAPTURED' || payment.status === 'SUCCESS') paymentStatus = 'PAID';
        else if (payment.status === 'REFUNDED') paymentStatus = 'REFUNDED';
        else if (payment.status === 'FAILED') paymentStatus = 'FAILED';
        else paymentStatus = payment.status;
      }
      return { ...exam, paymentStatus };
    });

    // Compute stats
    const completedSessions = await prisma.examRequest.count({
      where: {
        candidateId: user.candidateProfile.id,
        status: 'COMPLETED',
      },
    });

    // Average rating from scribe reviews (if any)
    const reviews = await prisma.scribeReview.aggregate({
      _avg: { rating: true },
      where: {
        request: {
          candidateId: user.candidateProfile.id,
        },
      },
    });
    const averageRating = reviews._avg.rating || 0;

    return {
      profile: {
        name: user.name,
        gender: user.gender,
        phone: user.phone,
      },
      upcomingExams: enriched,
      stats: {
        completedSessions,
        averageRating,
      },
    };
  }

  /**
   * 7. Volunteer Dashboard with UPI check flag
   */
  static async getVolunteerDashboard(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { volunteerProfile: true },
    });
    if (!user) throw new Error('User not found');
    if (!user.volunteerProfile) {
      throw new Error('Volunteer profile not found for this user');
    }

    const upcomingAssignments = await prisma.examRequest.findMany({
      where: {
        volunteerId: user.volunteerProfile.id,
        status: { notIn: ['CANCELLED', 'REFUNDED'] },
      },
      include: {
        candidate: { include: { user: true } },
      },
      orderBy: { examDate: 'asc' },
    });

    const completedExams = await prisma.examRequest.count({
      where: {
        volunteerId: user.volunteerProfile.id,
        status: 'COMPLETED',
      },
    });

    const hasUpi = !!user.volunteerProfile.upiId;

    return {
      profile: {
        name: user.name,
        gender: user.gender,
        phone: user.phone,
        upiId: user.volunteerProfile.upiId,
        isAvailable: user.volunteerProfile.isAvailable,
        xpPoints: user.volunteerProfile.xpPoints,
      },
      upcomingAssignments,
      stats: {
        completedExams,
        xpPoints: user.volunteerProfile.xpPoints,
        hasUpi,
      },
    };
  }
}

module.exports = UserService;