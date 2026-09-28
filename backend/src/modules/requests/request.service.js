const prisma = require('../../config/database');
const { generateVerificationPin } = require('../../utils/pinGenerator');
const { generateWhatsAppAlertLink } = require('../../utils/deepLinkGenerator');
const PaymentService = require('../payments/payment.service'); // NEW


class RequestsService {
  /**
   * 1. Create an Exam Request with Secure PINs & Optional Emergency WhatsApp Deep Link
   */
  static async createRequest(data, candidateId) {
    const targetCandidateId = candidateId || data.candidateId;

    // Verify CandidateProfile exists with linked User details for WhatsApp alerts
    const candidateExists = await prisma.candidateProfile.findUnique({
      where: { id: targetCandidateId },
      include: {
        user: { select: { phone: true, name: true } },
      },
    });

    if (!candidateExists) {
      throw new Error(
        `Candidate profile with ID '${targetCandidateId}' does not exist.`
      );
    }

    const lat = parseFloat(data.examCenterLat || data.lat || 0.0);
    const lng = parseFloat(data.examCenterLng || data.lng || 0.0);

    // Generate secure crypto PINs
    const invigilatorPin = generateVerificationPin();
    const completionPin = generateVerificationPin();

    // Create base request record
    const newRequest = await prisma.examRequest.create({
      data: {
        candidateId: targetCandidateId,
        examName: data.examName,
        advtNumber: data.advtNumber || null,
        admitCardUrl: data.admitCardUrl || null,
        examDate: new Date(data.examDate),
        durationMinutes: parseInt(data.durationMinutes, 10) || 120,
        genderPref: data.genderPref || 'ANY',
        examCenterName: data.examCenterName || null,
        examCenterLat: lat,
        examCenterLng: lng,
        masterExamId: data.masterExamId || null,
        isFromMasterRegistry: Boolean(data.masterExamId),
        invigilatorPin,
        completionPin,
        status: 'PENDING_PAYMENT',
      },
    });

    // Populate PostGIS spatial Point geometry if valid coordinates provided
    if (lat !== 0.0 && lng !== 0.0) {
      await prisma.$executeRaw`
        UPDATE "ExamRequest"
        SET "examLocation" = ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)
        WHERE id = ${newRequest.id}
      `;
    }

    // Generate WhatsApp Emergency Alert Link if marked as urgent/emergency
    let emergencyLink = null;
    if (data.isEmergency) {
      const candidatePhone = candidateExists.user?.phone || '910000000000';
      emergencyLink = generateWhatsAppAlertLink(
        candidatePhone,
        data.examName,
        data.examCenterName || 'Assigned Exam Center',
        newRequest.id
      );
    }

    return {
      ...newRequest,
      emergencyLink,
    };
  }

  /**
   * 2. Fetch Requests for Candidate or System
   */
  static async getUserRequests(candidateId) {
    return await prisma.examRequest.findMany({
      where: candidateId ? { candidateId } : {},
      include: {
        volunteer: {
          select: {
            id: true,
            user: { select: { name: true, phone: true } },
          },
        },
        masterExam: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * 3. Fetch Single Request Details
   */
  static async getRequestById(id) {
    return await prisma.examRequest.findUnique({
      where: { id },
      include: {
        candidate: {
          include: {
            user: { select: { id: true, name: true, phone: true } },
          },
        },
        volunteer: {
          include: {
            user: { select: { id: true, name: true, phone: true } },
          },
        },
        payments: true,
        review: true,
      },
    });
  }

  /**
   * 4. Verify Invigilator Check-In PIN (Transitions status from MATCHED -> IN_PROGRESS)
   */
  static async verifyStartPin(requestId, pin) {
    const request = await prisma.examRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new Error(`Exam request with ID '${requestId}' not found.`);
    }

    if (request.status !== 'MATCHED') {
      throw new Error(
        `Cannot start exam. Current status is '${request.status}', but must be 'MATCHED'.`
      );
    }

    if (request.invigilatorPin !== String(pin).trim()) {
      throw new Error('Invalid Invigilator Start PIN.');
    }

    return await prisma.examRequest.update({
      where: { id: requestId },
      data: {
        status: 'IN_PROGRESS',
        pinVerifiedAt: new Date(),
      },
    });
  }

  /**
   * 5. Verify Invigilator Completion PIN (Transitions status from IN_PROGRESS -> COMPLETED)
   */
  static async verifyCompletionPin(requestId, pin) {
    const request = await prisma.examRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new Error(`Exam request with ID '${requestId}' not found.`);
    }

    if (request.status !== 'IN_PROGRESS') {
      throw new Error(
        `Cannot complete exam. Current status is '${request.status}', but must be 'IN_PROGRESS'.`
      );
    }

    if (request.completionPin !== String(pin).trim()) {
      throw new Error('Invalid Completion PIN.');
    }

    // Update to COMPLETED
    const updated = await prisma.examRequest.update({
      where: { id: requestId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    });

    // Fire-and-forget payout (don't await, but catch errors and log)
    PaymentService.releaseEscrowPayout(requestId)
      .then(result => {
        console.log(`Payout successful for request ${requestId}:`, result);
      })
      .catch(err => {
        console.error(`Payout failed for request ${requestId}:`, err.message);
      });

    return updated;
  }
}

module.exports = RequestsService;